# Event

> Details for the event: shows date, title, hosts, along with the thumbnail for the first host. See fetch.js for data fetching.

## Related Projects

  - https://github.com/teamName/relatedEvents (WIP)
  - https://github.com/teamName/rsvp
  - x https://github.com/teamName/location
  - x https://github.com/teamName/comments
  - https://github.com/teamName/attendees

## Table of Contents

- [Event](#event)
  - [Related Projects](#related-projects)
  - [Table of Contents](#table-of-contents)
  - [Usage](#usage)
  - [Requirements](#requirements)
    - [Installing Dependencies](#installing-dependencies)
  - [Development](#development)
  - [Production](#production)
  - [API](#api)

## Usage

> Some usage instructions

## Requirements

- Node 6.13.0
- React
- Webpack
- Semantic UI


### Installing Dependencies

From within the root directory:

```sh
npm install -g webpack
npm install
```

## Development

For development mode this project uses nodemon and webpack watching for changes

```sh
npm run build:dev
npm run start:dev
```

## Production

For production mode this project uses node and webpack in production

```sh
npm run build:prod
npm start
```

## API
GET /event/:eventId
- Returns information about an event, in JSON format

```json
{
  "title": "STRING",
  "org_name": "STRING",
  "org_private": "boolean",
  "local_date_time": "STRING", // (in ISO 8601 format)
  "orgId": "STRING",
}
```

Example:
```json
{
  "title": "Adaptive dedicated Graphic Interface",
  "org_name": "Eichmann - Hoeger",
  "org_private": true,
  "local_date_time": "2020-04-26T17:35:14.598Z",
  "orgId": "o0"
}
```
POST /event/:eventId
- Adds a new event. The body of the POST request should be JSON, in the following format:

```json
{
  "title": "STRING",
  "local_date_time": "STRING", // (in ISO 8601 format)
  "orgId": "STRING",
  // optional, defaults to null
  "series": {
    "frequency": {
      "day_of_week": "STRING",
      "interval": "NUMBER",
    },
    "description": "STRING"
  },
}
```

Example:
```json
{
  "title": "Adaptive dedicated Graphic Interface",
  "local_date_time": "2020-04-26T17:35:14.598Z",
  "orgId": "o0",
  "series": {
    "frequency": {
      "day_of_week": "Sunday",
      "interval": 2,
    },
    "description": "Every 2nd Tuesday of the month until May 2020"
  },
}
```

PUT /event/:eventId
- Updates (or partially updates) an event. The body of the PUT request should be JSON in the following format. To update a nested value, you must provide the nested value in the proper shape. Omitted values will not be deleted by updating other nested values.

```json
{
  "title": "STRING",
  "local_date_time": "STRING", // (in ISO 8601 format)
  "orgId": "STRING",
  "series": {
    "frequency": {
      "day_of_week": "STRING",
      "interval": "NUMBER",
    },
    "description": "STRING",
  },
}
```

Example:
```json
// title, local_date_time, orgId, series.frequency.day_of_week, & series.description
// will all retain their values, even though we are updating interval to 1 instead of 2.
{
  "series": {
    "frequency": {
      "interval": 1
    }
  }
}
```

DELETE /event/:eventId
- Removes the target event
