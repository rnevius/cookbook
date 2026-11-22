#!/usr/bin/env bash
set -euo pipefail
umask 022

mode=$1
upload=$2
base=/opt/cookbook
data=/var/lib/cookbook
for command in curl tar xz sha256sum flock sudo; do command -v "$command" >/dev/null; done

if [[ $mode == setup ]]; then
  [[ $EUID -eq 0 ]] || { echo 'Setup requires root.' >&2; exit 1; }
  if ! id cookbook >/dev/null 2>&1; then
    useradd --system --user-group --home-dir "$data" --shell /usr/sbin/nologin cookbook
  fi
  if ! id cookbook-deploy >/dev/null 2>&1; then
    useradd --system --user-group --create-home --home-dir /home/cookbook-deploy --shell /bin/bash cookbook-deploy
  fi
  install -d -m 755 "$base" "$base/releases" "$base/runtimes"
  chown -R cookbook-deploy:cookbook-deploy "$base/releases" "$base/runtimes"
  install -d -m 700 -o cookbook -g cookbook "$data"
  install -d -m 700 /var/backups/cookbook
  tar --no-same-owner --no-same-permissions -xzf "$upload/release.tar.gz" -C "$upload" \
    deploy/cookbook.service deploy/activate.sh deploy/remote.sh
  install -o root -g root -m 755 "$upload/deploy/activate.sh" /usr/local/sbin/cookbook-activate
  install -o root -g root -m 644 "$upload/deploy/cookbook.service" /etc/systemd/system/cookbook.service
  echo 'cookbook-deploy ALL=(root) NOPASSWD: /usr/local/sbin/cookbook-activate' > "$upload/sudoers"
  visudo -cf "$upload/sudoers"
  install -o root -g root -m 440 "$upload/sudoers" /etc/sudoers.d/cookbook
  systemctl daemon-reload
  systemctl enable cookbook.service
  chown -R cookbook-deploy:cookbook-deploy "$upload"
  exec runuser -u cookbook-deploy -- bash "$upload/deploy/remote.sh" deploy "$upload"
fi
[[ $mode == deploy && $(id -un) == cookbook-deploy ]] || {
  echo 'Deploy using the cookbook-deploy SSH account.' >&2; exit 1;
}
exec 9>"$base/releases/.deploy.lock"
flock -n 9 || { echo 'Another Cookbook deployment is running.' >&2; exit 1; }

release=$(mktemp -d "$base/releases/$(date -u +%Y%m%dT%H%M%SZ).XXXXXXXX")
chmod 755 "$release"
tar --no-same-owner --no-same-permissions -xzf "$upload/release.tar.gz" -C "$release"
version=$(sed -n 's/^node = "\([0-9.]*\)"$/\1/p' "$release/mise.toml")
[[ $version =~ ^24\.[0-9]+\.[0-9]+$ ]] || { echo 'Invalid pinned Node version.' >&2; exit 1; }
case $(uname -m) in
  x86_64) arch=x64 ;;
  aarch64) arch=arm64 ;;
  *) echo 'Unsupported server architecture.' >&2; exit 1 ;;
esac
runtime="$base/runtimes/node-v$version-linux-$arch"
if [[ ! -x $runtime/bin/node ]]; then
  filename="node-v$version-linux-$arch.tar.xz"
  curl -fsSL --retry 3 "https://nodejs.org/dist/v$version/$filename" -o "$upload/$filename"
  curl -fsSL --retry 3 "https://nodejs.org/dist/v$version/SHASUMS256.txt" -o "$upload/SHASUMS256.txt"
  (cd "$upload"; awk -v name="$filename" '$2 == name' SHASUMS256.txt | sha256sum -c -)
  # Publish on the same filesystem, so an interrupted install cannot leave a partial runtime.
  installing=$(mktemp -d "$base/runtimes/.install.XXXXXXXX")
  tar --no-same-owner --no-same-permissions --strip-components=1 \
    -xJf "$upload/$filename" -C "$installing"
  chmod 755 "$installing"
  mv "$installing" "$runtime"
fi
ln -s "$runtime" "$release/runtime"
cd "$release"
# Build as the deploy user, with package lifecycle scripts disabled.
"$runtime/bin/node" "$runtime/lib/node_modules/npm/bin/npm-cli.js" ci \
  --omit=dev --ignore-scripts --no-audit --no-fund --cache "$upload/npm-cache"

sudo -n /usr/local/sbin/cookbook-activate "$release"
