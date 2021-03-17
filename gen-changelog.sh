#!/bin/sh
if [[ "$#" -ne 2 ]]; then
    echo "Usage: script from-tag to-tag"
    exit 1
fi

echo "Release $2 changes:" >> CHANGELOG
git log $1...$2 --pretty=oneline --reverse | grep -v Merge >> CHANGELOG
echo "" >> CHANGELOG

echo "Updated change log"

