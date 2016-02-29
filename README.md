# Brenda-web - A web based UI for use with Brenda

This project is a web based UI for use with Brenda [https://github.com/jamesyonan/brenda]


## Getting Started

To get you started you can simply clone the repository and run using node

### Prerequisites

You need git to clone the angular-seed repository. You can get git from
[http://git-scm.com/](http://git-scm.com/).

We also use a number of node.js tools to initialize and test angular-seed. You must have node.js and
its package manager (npm) installed.  You can get them from [http://nodejs.org/](http://nodejs.org/).

### Clone the project

Clone the brenda-web repository using [git][git]:

```
git clone https://github.com/njeirath/brenda-web.git
cd brenda-web
```

### Install Dependencies

```
npm install
```

### Run the Application

The simplest way to start this server is:

```
npm start
```

Now browse to the app at `http://localhost:8000/app/index.html`.


## Testing

There are two kinds of tests in the angular-seed application: Unit tests and End to End tests.

### Running Unit Tests

The easiest way to run the unit tests is to use the supplied npm script:

```
npm test
```

### End to end testing

End to end testing requires the application to be hosted so start the server first:

```
npm start
```

Next update the web driver tool:

```
npm run update-webdriver
```

Finally you can run the end-to-end tests:

```
npm run protractor
```

This script will execute the end-to-end tests against the application being hosted on the
development server.
