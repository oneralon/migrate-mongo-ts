# migrate-mongo-ts
A database migration tool for MongoDB in Node, fork from migrate-mongo (https://www.npmjs.com/package/migrate-mongo)


## Installation
````bash
$ npm install -g migrate-mongo-ts
````

## CLI Usage
````
$ migrate-mongo-ts
Usage: migrate-mongo-ts [options] [command]


  Commands:

    init                  initialize a new migration project
    create [description]  create a new database migration with the provided description
    up [options]          run all unapplied database migrations
    down [options]        undo the last applied database migration
    status [options]      print the changelog of the database

  Options:

    -h, --help     output usage information
    -V, --version  output the version number
````

## Quickstart
### Initialize a new project
Make sure you have [Node.js](https://nodejs.org/en/) 8.0.0 (or higher) installed.  

Create a directory where you want to store your migrations for your mongo database (eg. 'albums' here) and cd into it
````bash
$ mkdir albums-migrations
$ cd albums-migrations
````

Initialize a new migrate-mongo-ts project
````bash
$ migrate-mongo-ts init
Initialization successful. Please edit the generated migrate-mongo-config.js file
````

The above command did two things:
1. create a sample 'migrate-mongo-config.js' file and
2. create a 'migrations' directory

Edit the migrate-mongo-config.js file. An object or promise can be returned. Make sure you change the mongodb url:
````javascript
// In this file you can configure migrate-mongo

module.exports = {
  mongodb: {
    // TODO Change (or review) the url to your MongoDB:
    url: "mongodb://localhost:27017",

    // TODO Change this to your database name:
    databaseName: "YOURDATABASENAME",

    options: {
      useNewUrlParser: true // removes a deprecation warning when connecting
      //   connectTimeoutMS: 3600000, // increase connection timeout to 1 hour
      //   socketTimeoutMS: 3600000, // increase socket timeout to 1 hour
    }
  },

  // The migrations dir, can be an relative or absolute path. Only edit this when really necessary.
  migrationsDir: "migrations",

  // The mongodb collection where the applied changes are stored. Only edit this when really necessary.
  changelogCollectionName: "changelog"
};
````

### Creating a new migration script
To create a new database migration script, just run the ````migrate-mongo-ts create [description]```` command.

For example:
````bash
$ migrate-mongo-ts create blacklist_the_beatles
Created: migrations/20160608155948-blacklist_the_beatles.ts
````

A new migration file is created in the 'migrations' directory:
````javascript
import { Db } from 'mongodb';

export async function up(db: Db) {
  // TODO write your migration here.
  // See https://github.com/seppevs/migrate-mongo/#creating-a-new-migration-script
  // Example:
  // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: true}});
}

export async function down(db: Db) {
  // TODO write the statements to rollback your migration (if possible)
  // Example:
  // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
}
````

Edit this content so it actually performs changes to your database. Don't forget to write the down part as well.
The ````db```` object contains [the official MongoDB db object](https://www.npmjs.com/package/mongodb)
The ````client```` object is a [MongoClient](https://mongodb.github.io/node-mongodb-native/3.3/api/MongoClient.html) instance (which you can omit if you don't use it).

There are 3 options to implement the `up` and `down` functions of your migration:
1. Return a Promises
2. Use async-await

Always make sure the implementation matches the function signature:
* `function up(db, client) { /* */ }` should return `Promise`
* `function async up(db, client) { /* */ }` should contain `await` keyword(s) and return `Promise`

### Checking the status of the migrations
At any time, you can check which migrations are applied (or not)

````bash
$ migrate-mongo-ts status
┌─────────────────────────────────────────┬────────────┐
│ Filename                                │ Applied At │
├─────────────────────────────────────────┼────────────┤
│ 20160608155948-blacklist_the_beatles.js │ PENDING    │
└─────────────────────────────────────────┴────────────┘

````


### Migrate up
This command will apply all pending migrations
````bash
$ migrate-mongo-ts up
MIGRATED UP: 20160608155948-blacklist_the_beatles.js
````

If an an error occurred, it will stop and won't continue with the rest of the pending migrations

If we check the status again, we can see the last migration was successfully applied:
````bash
$ migrate-mongo-ts status
┌─────────────────────────────────────────┬──────────────────────────┐
│ Filename                                │ Applied At               │
├─────────────────────────────────────────┼──────────────────────────┤
│ 20160608155948-blacklist_the_beatles.js │ 2016-06-08T20:13:30.415Z │
└─────────────────────────────────────────┴──────────────────────────┘
````

### Migrate down
With this command, migrate-mongo-ts will revert (only) the last applied migration

````bash
$ migrate-mongo-ts down
MIGRATED DOWN: 20160608155948-blacklist_the_beatles.js
````

If we check the status again, we see that the reverted migration is pending again:
````bash
$ migrate-mongo-ts status
┌─────────────────────────────────────────┬────────────┐
│ Filename                                │ Applied At │
├─────────────────────────────────────────┼────────────┤
│ 20160608155948-blacklist_the_beatles.js │ PENDING    │
└─────────────────────────────────────────┴────────────┘
````

## Extra tips and tricks

### Using a custom config file
All actions (except ```init```) accept an optional ````-f```` or ````--file```` option to specify a path to a custom config file.
By default, migrate-mongo-ts will look for a ````migrate-mongo-config.js```` config file in of the current directory.

#### Example:

````bash
$ migrate-mongo-ts status -f '~/configs/albums-migrations.js'
┌─────────────────────────────────────────┬────────────┐
│ Filename                                │ Applied At │
├─────────────────────────────────────────┼────────────┤
│ 20160608155948-blacklist_the_beatles.ts │ PENDING    │
└─────────────────────────────────────────┴────────────┘

````

### Using npm packages in your migration scripts
You can use use Node.js modules (or require other modules) in your migration scripts.
It's even possible to use npm modules, just provide a `package.json` file in the root of your migration project:

````bash
$ cd albums-migrations
$ npm init --yes
````

Now you have a package.json file, and you can install your favorite npm modules that might help you in your migration scripts.
For example, one of the very useful [promise-fun](https://github.com/sindresorhus/promise-fun) npm modules.

### Using MongoDB's Transactions API
You can make use of the [MongoDB Transaction API](https://docs.mongodb.com/manual/core/transactions/) in your migration scripts.

Note: this requires both:
- MongoDB 4.0 or higher
- migrate-mongo-ts 7.0.0 or higher

migrate-mongo-ts will call your migration `up` and `down` function with a second argument: `client`.
This `client` argument is an [MongoClient](https://mongodb.github.io/node-mongodb-native/3.3/api/MongoClient.html) instance, it gives you access to the `startSession` function.
