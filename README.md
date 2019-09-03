# Gitto
Script to synchronize Toggl time entries with GitLab issues

## Installation

In project folder
```bash
yarn install
```

## Configuration

This script need to be configured with file, containing JSON data. Example config:
```json
{
  "api": {
    "gitlab": "https://gitlab.com/api/v4",
    "toggl": "https://toggl.com/reports/api/v2"
  },
  "keys": {
    "toggl": "your_toggl_api_key",
    "gitlab": "gitlab_key_with_api_permissions"
  },
  "toggl": {
    "user_agent": "your_app_name",
    "workspace_id": "id_of_toggl_workspace",
    "time_entries_since": "start_date_pulling_time_entries(YYYY-MM-DD)"
  }
}
```

## Usage

Run
```bash
node /path/to/gitto/folder/gitto.js /path/to/config.json
```


## API Docs

Gitto uses GitLab and Toggl APIs to make sync work

*  GitLab: https://docs.gitlab.com/ee/api/
*  Toggl: https://github.com/toggl/toggl_api_docs


