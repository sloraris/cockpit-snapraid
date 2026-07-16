# SnapRAID Cockpit Plugin

A native [Cockpit](https://cockpit-project.org/) page for [snapraid-daemon](https://github.com/amadvance/snapraid-daemon).

`snapraid-daemon`'s built-in web UI has no authentication and no TLS, so it's
not safe to expose on the network as-is. This plugin talks to the daemon's
REST API over `127.0.0.1` through `cockpit-bridge` instead, so it inherits
Cockpit's TLS, auth, and session handling for free, and looks like a native
part of Cockpit rather than an embedded third-party dashboard.

## Features

- **Dashboard** — array health, disk role counts, sync/scrub/diff timestamps, maintenance controls (diff/sync/scrub, with live progress)
- **Disks** — per-disk cards with storage usage and per-device SMART detail: temperature (with a 24h graph), power-on hours, failure probability, full SMART attribute list
- **Tasks** — queue/active/history of daemon-run commands, with expandable per-task logs
- **Differences** — files changed since the last sync, with per-file undelete
- **Recovery** — undelete by glob pattern, heal silent data errors, recovery history
- **Settings** — edit daemon configuration (schedule, thresholds, notifications, hooks)

## Screenshots

<!-- TODO: add screenshots, e.g. ![Dashboard](docs/screenshots/dashboard.png) -->

## Requirements

- `snapraid-daemon` running locally with its REST API enabled, bound to
  `127.0.0.1:7627` (see `snapraidd.conf`'s `net_port` / `net_acl`) — not
  exposed on the LAN, since the plugin reaches it locally through the bridge
- Cockpit (`cockpit-bridge` ≥ 137)

## Development

```
sudo apt install gettext nodejs npm make   # or dnf/zypper equivalents
make                                        # build into dist/
make devel-install                          # symlink into ~/.local/share/cockpit
```

Reload the Cockpit page after rebuilding. For continuous rebuilds on save:

```
make watch
```

`npm run eslint` / `npm run eslint:fix` and `npm run stylelint` / `npm run stylelint:fix`
check and fix code style.

## License

LGPL-2.1-or-later (see [LICENSE](./LICENSE)), scaffolded from
[cockpit-project/starter-kit](https://github.com/cockpit-project/starter-kit).
