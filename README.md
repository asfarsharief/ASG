# ASG Basketball Auction System

A comprehensive basketball player auction management system built with React and TypeScript. This application allows you to create and manage basketball player auctions with detailed player statistics, team management, and real-time bidding functionality.

## Features

### Player Management
- **Player Profiles**: Add players with photos and detailed basketball statistics
- **Basketball Stats**: Track comprehensive player performance metrics including:
  - Win Percentage
  - Points Per Game (PPG)
  - Field Goal Percentage (FG%)
  - Three-Point Percentage (3P%)
  - Free Throw Percentage (FT%)
  - Rebounds Per Game (RPG)
  - Assists Per Game (APG)
  - Steals Per Game (SPG)
  - Blocks Per Game (BPG)
  - Turnovers Per Game (TOPG)
  - Games Played
  - Minutes Per Game (MPG)

### Auction System
- **Multi-Round Auctions**: Support for multiple auction rounds with unsold players
- **Team Management**: Create teams with captains, vice-captains, and budget constraints
- **Band System**: Organize players into price bands with base prices
- **Real-Time Bidding**: Live auction interface with increment buttons and budget tracking
- **Player Photos**: Display player photos throughout the auction interface

### Data Management
- **Export Functionality**: Export auction results to Excel with comprehensive player statistics
- **Data Backup**: Import/export functionality for data persistence and portability
- **Local Storage**: Client-side data storage with automatic backup

## Getting Started

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Basketball Statistics

The system tracks comprehensive basketball statistics for each player:

- **Offensive Stats**: Points per game, field goal percentage, three-point percentage, free throw percentage
- **Defensive Stats**: Rebounds per game, steals per game, blocks per game
- **Team Stats**: Assists per game, turnovers per game, win percentage
- **Usage Stats**: Games played, minutes per game

These statistics are displayed throughout the auction interface and included in exported data for comprehensive player evaluation.

## Technology Stack

- **Frontend**: React 19 with TypeScript
- **UI Framework**: Material-UI (MUI)
- **Routing**: React Router
- **Storage**: LocalForage for client-side persistence
- **Export**: XLSX for Excel file generation
- **Icons**: Material-UI Icons

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
