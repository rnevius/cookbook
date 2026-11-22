#!/bin/bash
set -euo pipefail
export PATH=/usr/sbin:/usr/bin:/sbin:/bin
umask 077

[[ $EUID -eq 0 && $# -eq 1 ]] || exit 1
base=/opt/cookbook
data=/var/lib/cookbook
backups=/var/backups/cookbook
exec 9>/run/lock/cookbook-deploy.lock
flock -n 9 || { echo 'Another activation is running.' >&2; exit 1; }
if [[ $1 == stop ]]; then
  exec systemctl stop cookbook.service
fi
release=$1
# The deploy user may select application code, never root commands or service files.
[[ $release =~ ^/opt/cookbook/releases/[a-zA-Z0-9._-]+$ &&
   $(realpath -e -- "$release") == "$release" && -d $release ]] || exit 1
stopped=false
switched=false
was_active=false
backup=
finish() {
  status=$?
  if [[ $status -ne 0 ]]; then
    if [[ $switched == true ]]; then
      systemctl stop cookbook.service || true
      echo "Activation failed; Cookbook is stopped. Database backup: $backup" >&2
      echo 'Inspect journalctl -u cookbook.service before recovery; code rollback does not undo migrations.' >&2
    elif [[ $stopped == true && $was_active == true ]]; then
      systemctl start cookbook.service || true
    fi
  fi
}
trap finish EXIT
if systemctl is-active --quiet cookbook.service; then was_active=true; fi
systemctl stop cookbook.service
stopped=true
backup="$backups/$(basename "$release")"
# Never reuse a backup directory, even when activating the same release again.
mkdir -m 700 "$backup"
install -d -m 700 "$backup/database"
cp -a "$data/." "$backup/database/"
if [[ -L $base/current ]]; then
  readlink "$base/current" > "$backup/release"
  ln -sfn "$(readlink "$base/current")" "$base/previous"
fi
ln -sfn "$release" "$base/.current-next"
switched=true
mv -Tf "$base/.current-next" "$base/current"
systemctl reset-failed cookbook.service
systemctl start cookbook.service
for attempt in {1..30}; do
  if systemctl is-active --quiet cookbook.service && \
    [[ $(curl -fs --max-time 2 http://127.0.0.1:3000/health) == '{"status":"ok"}' ]]; then
    echo "Deployed $release"
    echo "Pre-deployment database backup: $backup"
    exit 0
  fi
  sleep 1
done
echo 'Cookbook did not become healthy within 30 checks.' >&2
exit 1
