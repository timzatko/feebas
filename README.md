# feebas

<p align="center">
    <img alt="feebas logo" src="./packages/desktop_app/src/favicon.256x256.png?raw=true">
</p>

Feebas is screenshot comparison tool which is intended to be used as a part of catching the visual regressions in end to end tests.

```npm install --save-dev feebas```

# How it works?

The basic philosophy of feebas is to compare __current__ screenshots (e.g. screenshots taken during e2e tests in pipeline) with __truth__ screenshots which defines the desired appearance of the application. 
 
 ![app preview](./docs/images/app_preview.png)
 
# Recommended Setup and Workflow
 
1. Screenshot your application during e2e tests in pipeline (e.g. gitlab pipeline) and save the screenshots as job artifacts. If you are using [Cypress](https://github.com/cypress-io/cypress) you can use [screenshot](https://docs.cypress.io/api/commands/screenshot.html#Syntax) function to take screenshots.  
2. Define the truth screenshots (e.g. with first run of the pipeline) and save them into your repository. Setup [GIT LFS](https://git-lfs.github.com/) for your repository to handle the big files.
3. Setup feebas (proceed to section - [setup](#setup))

Now, when your pipeline fails because of visual regression. 

1. Checkout on the commit of that pipeline - run `git checkout <commit_id>`
2. Open feebas - `npx feebas`
3. Look for the differences in screenshots
 - if your visual changes __were intended__
   - Select screenshots you want to update
   - Click on the approve button in top right corner
   - It will overwrite screenshots in the repository, so you need to `git add .` them and then `git commit` them
 - if your visual changes __were not intended__
   - Fix the source of visual regression (bug)
   - Push the fix and proceed to the first step

## Setup

1. Install feebas ```npm install --save-dev feebas``` (you probably want it as a dev dependency)
2. Create `feebas.config.json` in your project root, the file should look like this. Alternatively you can provide path to configuration file - `npx feebas --config ./example/path/to/feebas.config.json`. Example file with gitlab integration is available [here](docs/CONFIGURATION.md).
    ```
    {
        "projects": [
            {
                "name": "example",
                "screenshots": {
                    "current": {
                       ... // some integration (e.g. gitlab)
                    },
                    "truth": {
                       "type": "fs-local",
                       "path": "./example/path/to/truth_screenshots"
                   }
                }
            }
        ]
    }
    ``` 

## Running feebas

You can run feebas via `npx feebas`. Possible arguments.
- __config__ - path to config file, the default path is `./feebas.config.json` relative to repository root. Example: `npx feebas --config=/feebas/feebas.config.json` 
- __project__ - project to open. If you have only one project defined in configuration file, that project is opened by default. If you have multiple projects, the home page with project selector is opened on feebas launch. If you want to bypass that screen use `project` argument. Example: `npx feebas --project=SomeProjectName` 

### Integrations

#### Gitlab

- `url` - string - gitlab url
- `project_id` - number - id of the gitlab project - repository
- `authentication` - object
  - `type` - string - type of authentication into the gitlab, currently is available authentication only with _access token_. For authentication with `access_token` [get your gitlab access token](https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html#creating-a-personal-access-token) and set it into the environment variable `FEEBAS_GITLAB_TOKEN`.
- `jobs` - array - array of jobs from which will be downloaded screenshots.
    - __job__
        - `name` - string - name of the job
        - `path` - string (optional) - path to the directory inside job artifacts (e.g. to the directory where are current screenshots stored)   
            ```json
                {
                  "name": "exmaple job name",
                  "path": "/example/path"
                }
            ```
- `strategy` - string - "merge" | "default" (optional) - when merge option is used all artifacts from the jobs will be merged, otherwise they will be stored in the directory with name of their job name
- `filter` - object - you can define files from artifacts which will be ignored
    - `rules` - array of strings
    - `strategy` - "blacklist" | "whitelist"
        ```json
            {
                  "rules": ["*(failed)*", "tmp_*"],
                  "strategy": "blacklist"
            }
         ```

### Opening Specific Project and Commit (experimental)

It is possible to open feebas from your browser. Just open URL in this format:
`feebas://projectId:commitId`. 

# Contributing

Contributing guidelines are available in [CONTRIBUTING.md](./CONTRIBUTING.md).
