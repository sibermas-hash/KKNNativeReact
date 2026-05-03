<?php
$resourcesDir = __DIR__.'/app/Http/Resources/Api/V1';
$files = glob($resourcesDir . '/*.php');

$issues = [];
$passes = 0;

$tsModelsCode = file_get_contents(__DIR__.'/../../packages/shared-types/src/models.ts');

foreach ($files as $file) {
    $content = file_get_contents($file);
    $basename = basename($file, '.php');
    $className = $basename;
    
    $fileIssues = [];

    // Check explicit toArray (not calling parent::toArray or ->resource->toArray)
    if (preg_match('/parent::toArray/', $content) || preg_match('/\$this->resource->toArray\(/', $content)) {
        $fileIssues[] = "Uses shortcut parent::toArray() or \$this->resource->toArray() instead of explicit fields";
    }

    // Check relationship loading
    if (preg_match('/\$this->[a-zA-Z0-9_]+$/m', $content) && !preg_match('/whenLoaded/i', $content)) {
        // This is a rough check, we specifically want to ensure whenLoaded is used if relationships are present.
        // Let's just check if there's any $this->relationship without whenLoaded.
        // Better: look for new SomeResource($this->relationship) where it's not wrapped in whenLoaded.
        if (preg_match('/new [A-Za-z]+Resource\(\$this->[a-zA-Z0-9_]+\)/', $content)) {
             $fileIssues[] = "May load relationship without \$this->whenLoaded()";
        }
    }

    // Check sensitive fields
    if (preg_match('/\'password\'/i', $content) || preg_match('/\'remember_token\'/i', $content) || preg_match('/\'api_key\'/i', $content) || preg_match('/\'secret\'/i', $content)) {
        $fileIssues[] = "Exposes sensitive fields (password, token, or secret)";
    }

    // Check TS interface
    $tsInterfaceName = str_replace('Resource', '', $className);
    if (!preg_match('/interface\s+' . preg_quote($tsInterfaceName, '/') . '\b/', $tsModelsCode)) {
        $fileIssues[] = "Missing TS interface $tsInterfaceName in models.ts";
    }

    if (empty($fileIssues)) {
        $passes++;
    } else {
        $issues[$className] = $fileIssues;
    }
}

echo "Passed Resources: $passes\n";
echo "Resources with Issues:\n";
foreach ($issues as $res => $errs) {
    echo "- $res: \n  " . implode("\n  ", $errs) . "\n";
}
