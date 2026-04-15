<?php

$dirs = ['app/Models/KKN/', 'app/Models/Master/'];
$files = ['app/Models/User.php', 'app/Models/Project.php', 'app/Models/ApiKey.php'];

foreach ($dirs as $dir) {
    if (is_dir($dir)) {
        $it = new RecursiveDirectoryIterator($dir);
        foreach (new RecursiveIteratorIterator($it) as $file) {
            if ($file->getExtension() === 'php') {
                $files[] = $file->getPathname();
            }
        }
    }
}

$files = array_unique($files);

foreach ($files as $file) {
    if (!file_exists($file)) continue;
    
    $content = file_get_contents($file);
    if (!preg_match("/#\[(Table|Connection|Fillable|Casts|Cast|Hidden)/", $content)) {
        continue;
    }
    
    $newContent = $content;
    
    $table = null;
    $connection = null;
    $fillableArr = null;
    $castsArr = null;
    $hiddenArr = null;

    // Class level attributes
    if (preg_match("/#\[Table\(['\"]([^'\"]+)['\"]\)\s*\]/", $newContent, $m)) {
        $table = $m[1];
        $newContent = str_replace($m[0], '', $newContent);
    }
    if (preg_match("/#\[Connection\(['\"]([^'\"]+)['\"]\)\s*\]/", $newContent, $m)) {
        $connection = $m[1];
        $newContent = str_replace($m[0], '', $newContent);
    }
    if (preg_match("/#\[Fillable\(\[([^\]]+)\]\)\s*\]/s", $newContent, $m)) {
        $fillableArr = "[" . $m[1] . "]";
        $newContent = str_replace($m[0], '', $newContent);
    }
    if (preg_match("/#\[Casts\(\[([^\]]+)\]\)\s*\]/s", $newContent, $m)) {
        $castsArr = "[" . $m[1] . "]";
        $newContent = str_replace($m[0], '', $newContent);
    }
    if (preg_match("/#\[Hidden\(\[([^\]]+)\]\)\s*\]/s", $newContent, $m)) {
        $hiddenArr = "[" . $m[1] . "]";
        $newContent = str_replace($m[0], '', $newContent);
    }

    // Property level attributes
    // Capture #[Fillable] on property
    if (preg_match_all("/#\[Fillable\]\s+(?:public|protected|private)\s+[\w?|]+\s+\$(\w+)/s", $newContent, $matches)) {
        if ($fillableArr === null) {
            $fillableArr = "[\n        '" . implode("',\n        '", $matches[1]) . "',\n    ]";
        }
        $newContent = preg_replace("/#\[Fillable\]\s+/", '', $newContent);
    }
    
    // Capture #[Fillable(['...'])] on property
    if (preg_match_all("/#\[Fillable\(\[([^\]]+)\]\)\s*\]\s+(?:public|protected|private)\s+[\w?|]+\s+\$(\w+)/s", $newContent, $matches)) {
        if ($fillableArr === null) {
            // Take the first one found as it's likely the same for all if they use this pattern
            $fillableArr = "[" . $matches[1][0] . "]";
        }
        $newContent = preg_replace("/#\[Fillable\(\[([^\]]+)\]\)\s*\]\s+/", '', $newContent);
    }

    // Property level Cast
    if (preg_match_all("/#\[Cast\(['\"]([^'\"]+)['\"]\)\s*\]\s+(?:public|protected|private)\s+[\w?|]+\s+\$(\w+)/s", $newContent, $matches)) {
        if ($castsArr === null) {
            $castsArr = "[\n";
            foreach ($matches[1] as $idx => $type) {
                $prop = $matches[2][$idx];
                $castsArr .= "        '$prop' => '$type',\n";
            }
            $castsArr .= "    ]";
        }
        $newContent = preg_replace("/#\[Cast\(['\"][^'\"]+['\"]\)\s*\]\s+/", '', $newContent);
    }

    $properties = "";
    if ($connection) $properties .= "    protected \$connection = '$connection';\n\n";
    if ($table) $properties .= "    protected \$table = '$table';\n\n";
    if ($fillableArr) $properties .= "    protected \$fillable = $fillableArr;\n\n";
    if ($hiddenArr) $properties .= "    protected \$hidden = $hiddenArr;\n\n";
    if ($castsArr) $properties .= "    protected \$casts = $castsArr;\n\n";

    // Insert properties
    $newContent = preg_replace_callback(
        "/(class\s+\w+(?:\s+extends\s+[\w\\\\]+)?(?:\s+implements\s+[\w\\\\,\s]+)?)\s*(\{)?/s",
        function($m) use ($properties) {
            return $m[1] . "\n{\n" . $properties;
        },
        $newContent,
        1
    );

    // Clean up imports
    $newContent = preg_replace("/use Illuminate\\\\Database\\\\Eloquent\\\\Attributes\\\\(Table|Connection|Fillable|Casts|Cast|Hidden);\s*\n/", '', $newContent);
    
    // Final cleanup: remove double braces if any (due to regex replacement)
    // Actually the regex replaces the { too if it was there.
    // Let's check if we have double {{
    $newContent = preg_replace("/{\s*\n\s*{\n/", "{\n", $newContent);
    
    // Fix multiple newlines
    $newContent = preg_replace("/\n\n\n+/", "\n\n", $newContent);

    if ($newContent !== $content) {
        file_put_contents($file, $newContent);
        echo "Updated $file\n";
    }
}
