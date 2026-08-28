<?php
/**
 * Child theme functions and definitions
 */

function developer_enqueue_custom_js() {
    // Check if the file exists before attempting to get its file modification time
    $js_path = get_stylesheet_directory_path() . '/js/custom.js';
    $version = file_exists($js_path) ? filemtime($js_path) : '1.0.0';

    wp_enqueue_script(
        'site-custom-js', 
        get_stylesheet_directory_uri() . '/js/custom.js', 
        array(), 
        $version, 
        true 
    );
}
add_action('wp_enqueue_scripts', 'developer_enqueue_custom_js');
