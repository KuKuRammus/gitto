'use strict';

// Require everything
const fs = require('fs');
const axios = require('axios');
const logger = require('./logger');

// Ensure config path is passed
if (process.argv.length <= 2) {
    console.error('Please specify config file');
    process.exit(1);
}

// Read config file
let config = {};
try {
    const configFile = fs.readFileSync(process.argv[2]);
    config = require('./config')(JSON.parse(String(configFile)));
    if (config === null) {
        console.error('Error while reading config file');
        process.exit(2)
    }
} catch (e) {
    console.error(e);
    console.error('Cannot read/parse config file!');
    process.exit(3);
}

// Fetch gitlab projects
console.log('');
logger('STARTING -----------------------------------------------------------------');
logger('Fetching GitLab projects');
const projects = {};
const entries = {};
axios.get(`${config.api.gitlab}/projects`, {
    headers: { Authorization: `Bearer ${config.keys.gitlab}` }
}).then((response) => {
    logger('Successfully got project list from GitLab');
    for (const projectIndex in response.data) {
        if (!response.data.hasOwnProperty(projectIndex)) continue;
        const project = response.data[projectIndex];
        projects[`${project['path_with_namespace']}`] = parseInt(project['id']);
    }

    // Fetch and filter toggl entries
    const togglDateSince = new Date();
    togglDateSince.setDate(togglDateSince.getDate() + 2);
    const togglEndDate = togglDateSince.toISOString().substr(0, 10);
    logger('Fetching Toggl entries');
    axios.get(`${config.api.toggl}/summary`, {
        params: {
            user_agent: config.toggl.user_agent,
            workspace_id: config.toggl.workspace_id,
            since: config.toggl.time_entries_since,
            grouping: 'tags',
            subgrouping: 'time_entries',
            until: togglEndDate
        },
        auth: {
            username: config.keys.toggl,
            password: 'api_token'
        }
    }).then((response) => {
        logger('Successfully got time entries from Toggl');
        if (!('data' in response.data)) {
            logger('No data is present in Toggl response'); return;
        }

        for (const tagIndex in response.data.data) {
            if (!response.data.data.hasOwnProperty(tagIndex)) continue;
            const tag = response.data.data[tagIndex];

            if (!('items' in tag)) continue;
            const tagItems = tag['items'];
            for (const entryIndex in tagItems) {
                if (!tagItems.hasOwnProperty(entryIndex)) continue;
                const singleEntry = tagItems[entryIndex];

                // Check if has gitlab task naming
                const entryTitleSplit = singleEntry['title']['time_entry'].split(' - ');
                if (!(/^\S+\/\S+#\d+$/g.test(entryTitleSplit[0]))) continue;

                // Attach to all entries
                if (!(entryTitleSplit[0] in entries)) { entries[entryTitleSplit[0]] = 0 }
                entries[entryTitleSplit[0]] += parseInt(parseInt(singleEntry['time']) / 1000);
            }
        }

        // Start updating tasks in gitlab
        logger('Updating GitLab tasks');
        for (const entryKey in entries) {
            if (!entries.hasOwnProperty(entryKey)) continue;
            const timeSpent = entries[entryKey];
            const [ entryProjectNamespace, entryTaskID ] = entryKey.split('#');
            if (!(entryProjectNamespace in projects)) continue;
            const entryProjectID = projects[entryProjectNamespace];
            const entryTimeSpent = entries[entryKey];

            // Fetch time tracking info from gitlab
            axios.get(`${config.api.gitlab}/projects/${entryProjectID}/issues/${entryTaskID}/time_stats`, {
                headers: { Authorization: `Bearer ${config.keys.gitlab}` }
            }).then((response) => {
                const timeEntryDelta = entryTimeSpent - parseInt(response.data['total_time_spent']);
                if (timeEntryDelta <= 0) return;
                const timeSpentHuman = `${timeEntryDelta}s`;

                axios.post(`${config.api.gitlab}/projects/${entryProjectID}/issues/${entryTaskID}/add_spent_time`, {
                    duration: timeSpentHuman
                }, { headers: { Authorization: `Bearer ${config.keys.gitlab}` } }).then((response) => {
                    logger(`${entryProjectNamespace}#${entryTaskID}: ${timeSpentHuman}`);
                }).catch((e) => {
                    console.log(e);
                    logger(`[ERROR] Cannot update time spent for task ${entryProjectNamespace}#${entryTaskID}`)
                })
            }).catch((e) => {
                logger(`[ERROR] Cannot load time tracking data for task ${entryProjectNamespace}#${entryTaskID}`);
            })
        }
    }).catch((e) => {
        logger('[ERROR] Failed to fetch time data from Toggl');
    });

}).catch((e) => {
    logger('[ERROR] Error while trying fetch project list from GitLab');
});

