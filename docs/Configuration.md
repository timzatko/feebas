# Configuration

This is the example of configuration file with gitlab integration which is using cypress for e2e tests.

```json
{
    "projects": [
        {
            "name": "example",
            "screenshots": {
                "current": {
                    "type": "gitlab",
                    "url": "https://gitlab.example.com",
                    "project_id": 42,
                    "authentication": {
                        "type": "access_token"
                    },
                    "jobs": [
                        {
                            "name": "application e2e tests",
                            "path": "/cypress/screenshots"
                        },
                        {
                            "name": "administration e2e tests",
                            "path": "/cypress/screenshots"
                        }
                    ],
                    "strategy": "merge",
                    "filter": {
                        "rules": ["*(failed)*"],
                        "strategy": "blacklist"
                    }
                },
                "truth": {
                    "type": "fs-local",
                    "path": "./screenshot_testing_truth"
                }
            }
        }
    ]
}

```