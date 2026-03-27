#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod api;
mod cloud;
mod commands;
mod config;
mod chisel;
mod credentials;
mod services;
mod plugins;
mod tray;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            tray::setup_tray(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::set_tray_state,
            commands::get_status,
            commands::get_config,
            commands::get_tunnels,
            commands::create_tunnel,
            commands::toggle_tunnel,
            commands::delete_tunnel,
            commands::stop_chisel,
            commands::start_chisel,
            commands::restart_chisel,
            commands::update_agent,
            commands::uninstall_agent,
            commands::rotate_certificate,
            commands::download_certificate,
            commands::get_panel_url,
            commands::get_logs,
            services::scan_services,
            services::get_service_registry,
            services::add_custom_service,
            services::remove_custom_service,
            plugins::get_plugins,
            plugins::install_plugin,
            plugins::enable_plugin,
            plugins::disable_plugin,
            plugins::uninstall_plugin,
            cloud::store_cloud_token,
            cloud::get_cloud_token,
            cloud::delete_cloud_token,
            cloud::validate_cloud_token,
            cloud::get_cloud_regions,
            cloud::get_cloud_sizes,
            cloud::provision_server,
            cloud::destroy_cloud_server,
            cloud::get_servers,
            cloud::set_active_server,
            cloud::add_managed_server,
            cloud::remove_server,
            cloud::check_server_health,
        ])
        .run(tauri::generate_context!())
        .expect("error while running portlama desktop");
}
