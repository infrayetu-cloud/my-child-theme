<?php
function developer_enqueue_custom_js() {
    wp_enqueue_script(
        'site-custom-js',
        get_stylesheet_directory_uri() . '/js/custom.js',
        array(),
        filemtime(get_stylesheet_directory() . '/js/custom.js'),  // was get_stylesheet_directory_path()
        true
    );
}
add_action('wp_enqueue_scripts', 'developer_enqueue_custom_js');