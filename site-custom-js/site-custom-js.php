<?php
/*
Plugin Name: Site Custom JS
Description: Loads custom.js on the front end
Version: 1.0.0
*/

function developer_enqueue_custom_js() {
    wp_enqueue_script(
        'site-custom-js',
        plugin_dir_url(__FILE__) . 'js/custom.js',
        array(),
        filemtime(plugin_dir_path(__FILE__) . 'js/custom.js'),
        true
    );
}
add_action('wp_enqueue_scripts', 'developer_enqueue_custom_js');