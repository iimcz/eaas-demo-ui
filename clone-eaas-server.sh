#!/bin/sh -eu

cloneProject() {
    project="$1"
    env_prefix="$(printf %s "$project" | tr -c 'a-zA-Z0-9' _)"
    shift

    try() {
        printf "\nTrying %s, branch %s\n" "$1" "$2" >&2
        git ls-remote --exit-code -- "$1" "$2" >&2
    }

    origin="$(git ls-remote --get-url origin)"
    remote="${origin%/}/../$project"
    branch="$(git branch --show-current)"

    if ! try "$remote" "$branch"; then
        branch="HEAD"
        if ! try "$remote" "$branch"; then
            remote="https://eaas.dev/$project"
            branch="$(git branch --show-current)"
            if ! try "$remote" "$branch"; then
                branch="HEAD"
                try "$remote" "$branch"
            fi
        fi
    fi

    printf '%s_repo=%s\n' "$env_prefix" "$remote"
    printf '%s_branch=%s\n' "$env_prefix" "$branch"

    printf '::notice title=%s::%s\n' "$project" "$remote $branch" >&2

    case "$branch" in
    HEAD)
        git clone --recursive -- "$remote" "$@" >&2
        ;;
    *)
        git clone --recursive -b "$branch" -- "$remote" "$@" >&2
        ;;
    esac
}

cloneProject eaas-server ./eaas-server
