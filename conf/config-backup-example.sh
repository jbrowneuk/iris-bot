#!/bin/sh

# A simple script that creates a backup of the current bot configuration in a
# compressed file named by the current time and puts that file to a SFTP server.
# This script is designed to be configured to run using a cron job.
#
# The expected strategy for the SSH login is to use SSH key-based authentication
# to prevent passwords being stored in plain text scripts. A command-line
# password should be the last resort, but if required, consult the sshpass
# documentation and modify this script accordingly.
#
# KNOWN ISSUE: no error checking is done so if the backup fails the script will
# just blindly continue and put an empty file.

SRC_DIR=/home/user/bot-config-directory
BACKUP_DIR=/home/user/backups
ZIP_NAME=${BACKUP_DIR}/bot-config-$(date +%F-%H-%M).tar.gz
SFTP_USER_AND_HOST=user@sftp.server
SFTP_PORT=2223
SFTP_DEST_DIR=/path/to/remote/backups

echo Backing up $SRC_DIR to $BACKUP_DIR
echo Making backup file $ZIP_NAME

# Create archive
tar -cvpzf $ZIP_NAME $SRC_DIR

# Upload to server
echo "put ${ZIP_NAME} ${SFTP_DEST_DIR}" | sftp -P $SFTP_PORT $SFTP_USER_AND_HOST

# Remove old backups
find "${BACKUP_DIR}/" -type f -mtime +7 -name '*.tar.gz' -delete
