#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{
    fs,
    path::{Path, PathBuf},
    process::{Child, Command, Stdio},
    sync::Mutex,
    thread,
    time::Duration,
};

#[cfg(unix)]
use std::os::unix::process::CommandExt;

use tauri::{Manager, RunEvent, WindowEvent};

#[cfg(unix)]
const SIGTERM: i32 = 15;

#[cfg(unix)]
const SIGKILL: i32 = 9;

#[cfg(unix)]
unsafe extern "C" {
    fn kill(pid: i32, sig: i32) -> i32;
}

struct BackendProcess {
    child: Mutex<Option<Child>>,
}

fn main() {
    let app = tauri::Builder::default()
        .setup(|app| {
            let child = start_backend(app);
            app.manage(BackendProcess {
                child: Mutex::new(child),
            });
            Ok(())
        })
        .on_window_event(|window, event| {
            if matches!(event, WindowEvent::CloseRequested { .. }) {
                stop_backend(window.app_handle());
                window.app_handle().exit(0);
            } else if matches!(event, WindowEvent::Destroyed) {
                stop_backend(window.app_handle());
            }
        })
        .build(tauri::generate_context!())
        .expect("failed to build app");

    app.run(|app_handle, event| {
        if matches!(event, RunEvent::Exit | RunEvent::ExitRequested { .. }) {
            stop_backend(app_handle);
        }
    });
}

fn start_backend(app: &tauri::App) -> Option<Child> {
    let data_root = app
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| PathBuf::from("app-data"));
    let database_dir = data_root.join("data");
    let model_dir = data_root.join("models");
    let database_path = database_dir.join("novel_assistant.sqlite");
    let _ = fs::create_dir_all(&database_dir);
    let _ = fs::create_dir_all(&model_dir);

    if let Some(sidecar_path) = find_backend_sidecar(app) {
        let mut command = Command::new(sidecar_path);
        configure_backend_command(&mut command);
        return command
            .env("NOVEL_ASSISTANT_DB_PATH", &database_path)
            .env("NOVEL_ASSISTANT_MODEL_DIR", &model_dir)
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
            .map_err(|error| {
                eprintln!("failed to start backend sidecar: {error}");
                error
            })
            .ok();
    }

    let Some(root) = find_backend_root(app) else {
        eprintln!("backend files were not found");
        return None;
    };

    let mut command = Command::new("uv");
    configure_backend_command(&mut command);
    command
        .args(["run", "python", "-m", "backend.server"])
        .current_dir(root)
        .env("NOVEL_ASSISTANT_DB_PATH", database_path)
        .env("NOVEL_ASSISTANT_MODEL_DIR", model_dir)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|error| {
            eprintln!("failed to start backend: {error}");
            error
        })
        .ok()
}

fn stop_backend(app: &tauri::AppHandle) {
    let state = app.state::<BackendProcess>();
    let mut child_slot = state.child.lock().expect("backend lock was poisoned");
    if let Some(mut child) = child_slot.take() {
        stop_backend_child(&mut child);
        let _ = child.wait();
    }
}

fn configure_backend_command(command: &mut Command) {
    #[cfg(unix)]
    {
        command.process_group(0);
    }
}

fn stop_backend_child(child: &mut Child) {
    #[cfg(unix)]
    {
        let process_group_id = child.id() as i32;
        unsafe {
            let _ = kill(-process_group_id, SIGTERM);
        }

        for _ in 0..10 {
            if matches!(child.try_wait(), Ok(Some(_))) {
                return;
            }
            thread::sleep(Duration::from_millis(100));
        }

        unsafe {
            let _ = kill(-process_group_id, SIGKILL);
        }
        return;
    }

    #[cfg(not(unix))]
    {
        let _ = child.kill();
    }
}

fn find_backend_root(app: &tauri::App) -> Option<PathBuf> {
    let dev_root = PathBuf::from(env!("CARGO_MANIFEST_DIR")).parent()?.to_path_buf();
    if is_backend_root(&dev_root) {
        return Some(dev_root);
    }

    let resource_root = app.path().resource_dir().ok()?;
    if is_backend_root(&resource_root) {
        return Some(resource_root);
    }

    let bundled_root = resource_root.join("_up_");
    if is_backend_root(&bundled_root) {
        return Some(bundled_root);
    }

    None
}

fn is_backend_root(path: &Path) -> bool {
    path.join("backend").join("server.py").exists() && path.join("pyproject.toml").exists()
}

fn find_backend_sidecar(app: &tauri::App) -> Option<PathBuf> {
    let mut roots = Vec::new();

    if let Ok(resource_root) = app.path().resource_dir() {
        roots.push(resource_root);
    }

    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            roots.push(exe_dir.to_path_buf());
        }
    }

    if let Some(dev_root) = PathBuf::from(env!("CARGO_MANIFEST_DIR")).parent() {
        roots.push(dev_root.join("src-tauri").join("binaries"));
    }

    roots.into_iter().find_map(|root| find_sidecar_in_dir(&root, 3))
}

fn find_sidecar_in_dir(root: &Path, max_depth: usize) -> Option<PathBuf> {
    if max_depth == 0 || !root.exists() {
        return None;
    }

    for entry in fs::read_dir(root).ok()? {
        let path = entry.ok()?.path();
        if path
            .file_name()
            .and_then(|name| name.to_str())
            .is_some_and(|name| name.starts_with("novel-assistant-backend"))
            && path.is_file()
        {
            return Some(path);
        }
        if path.is_dir() {
            if let Some(found) = find_sidecar_in_dir(&path, max_depth - 1) {
                return Some(found);
            }
        }
    }
    None
}
