<?php

declare(strict_types=1);

use PhpCsFixer\Config;
use PhpCsFixer\Finder;

$finder = Finder::create()
    ->in([
        __DIR__ . '/app',
        __DIR__ . '/config',
        __DIR__ . '/routes',
        __DIR__ . '/database',
    ])
    ->exclude([
        'vendor',
        'node_modules',
        'storage',
        'bootstrap/cache',
    ])
    ->name('*.php')
    ->notName('*.blade.php');

return (new Config())
    ->setRiskyAllowed(true)
    ->setRules([
        // Set ruleset
        '@PSR12' => true,
        '@PSR12:risky' => true,
        '@Symfony' => true,
        '@Symfony:risky' => true,

        // Declare strict types
        'declare_strict_types' => true,
        'strict_param' => true,
        'strict_comparison' => true,

        // Type hints
        'array_syntax' => ['syntax' => 'short'],
        'cast_spaces' => ['space' => 'single'],
        'return_type_declaration' => ['space_before' => 'none'],
        'type_declaration_spaces' => ['elements' => ['function', 'property']],

        // Naming conventions
        'no_unneeded_control_parentheses' => true,
        'no_unneeded_braces' => true,
        'no_unneeded_import_alias' => true,

        // Code organization
        'ordered_imports' => [
            'sort_algorithm' => 'alpha',
            'imports_order' => ['class', 'function', 'const'],
        ],
        'ordered_class_elements' => [
            'order' => [
                'use_trait',
                'case',
                'constant',
                'constant_public',
                'constant_protected',
                'constant_private',
                'property_public',
                'property_protected',
                'property_private',
                'construct',
                'destruct',
                'magic',
                'phpunit',
                'method_public',
                'method_protected',
                'method_private',
            ],
            'sort_algorithm' => 'alpha',
        ],

        // Whitespace
        'blank_line_before_statement' => [
            'statements' => ['return', 'throw', 'try', 'declare'],
        ],
        'method_chaining_indentation' => true,
        'no_trailing_whitespace' => true,
        'no_whitespace_in_blank_line' => true,
        'single_blank_line_at_eof' => true,
        'blank_lines_before_namespace' => true,

        // Control structures
        'yoda_style' => ['equal' => false, 'identical' => false, 'less_and_greater' => false],
        'simplified_if_return' => true,
        'simplified_null_return' => true,

        // Function
        'function_declaration' => true,
        'static_lambda' => true,
        'use_arrow_functions' => true,

        // Arrays
        'trailing_comma_in_multiline' => ['elements' => ['arrays']],
        'no_trailing_comma_in_singleline' => true,

        // Strings
        'single_quote' => true,
        'string_implicit_backslashes' => ['heredoc' => 'escape'],

        // Comments
        'no_empty_comment' => true,
        'single_line_comment_style' => ['comment_types' => ['hash']],

        // Error handling
        'no_useless_else' => true,
        'no_useless_return' => true,

        // Security
        'no_homoglyph_names' => true,

        // PHPDoc
        'phpdoc_separation' => true,
        'phpdoc_order' => true,
        'phpdoc_types_order' => [
            'null_adjustment' => 'always_last',
            'sort_algorithm' => 'alpha',
        ],
        'phpdoc_align' => ['align' => 'left'],
        'phpdoc_line_span' => [
            'property' => 'single',
            'method' => 'multi',
            'const' => 'single',
        ],

        // Imports
        'no_unused_imports' => true,
        'global_namespace_import' => [
            'import_classes' => true,
            'import_constants' => true,
            'import_functions' => false,
        ],

        // Language constructs
        'combine_consecutive_issets' => true,
        'combine_consecutive_unsets' => true,
        'empty_loop_condition' => true,
        'empty_loop_body' => ['style' => 'semicolon'],

        // Class usage
        'self_static_accessor' => true,
        'final_class' => false, // Don't auto-make classes final
        'final_internal_class' => true,

        // Casing
        'magic_constant_casing' => true,
        'native_function_casing' => true,
        'native_type_declaration_casing' => true,

        // Cast
        'modernize_types_casting' => true,
        'no_short_bool_cast' => true,

        // Control flow
        'nullable_type_declaration_for_default_null_value' => true,

        // Constants
        'constant_case' => ['case' => 'lower'],

        // Boolean
        'logical_operators' => true,

        // Classes
        'class_attributes_separation' => [
            'elements' => [
                'const' => 'one',
                'property' => 'one',
                'method' => 'one',
            ],
        ],
        'class_definition' => [
            'multi_line_extends_each_single_line' => true,
            'single_item_single_line' => true,
            'single_line' => false,
            'space_before_parenthesis' => false,
            'inline_constructor_arguments' => true,
        ],

        // Properties
        'visibility_required' => ['elements' => ['property', 'method', 'const']],

        // Namespaces
        'no_leading_namespace_whitespace' => true,
        'single_line_after_imports' => true,

        // Operators
        'standardize_not_equals' => true,
        'ternary_operator_spaces' => true,
        'ternary_to_null_coalescing' => true,
        'assign_null_coalescing_to_coalesce_equal' => true,

        // Functions
        'void_return' => true,

        // Aliases
        'no_alias_functions' => true,

        // Deprecations
        'no_unreachable_default_argument_value' => true,
    ])
    ->setFinder($finder)
    ->setCacheFile(__DIR__ . '/storage/.php_cs.cache');
