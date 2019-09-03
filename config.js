const configStructure = {
    api: {
        gitlab: '',
        toggl: ''
    },
    keys: {
        gitlab: '',
        toggl: ''
    },
    toggl: {
        user_agent: '',
        workspace_id: '',
        time_entries_since: '',
    },
};

module.exports = function(json) {
    configStructure.api.gitlab = json.api.gitlab;
    configStructure.api.toggl = json.api.toggl;
    configStructure.keys.gitlab = json.keys.gitlab;
    configStructure.keys.toggl = json.keys.toggl;
    configStructure.toggl.user_agent = json.toggl.user_agent;
    configStructure.toggl.workspace_id = json.toggl.workspace_id;
    configStructure.toggl.time_entries_since = json.toggl.time_entries_since;
    return configStructure;
};
