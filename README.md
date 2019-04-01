GistChecker
=====
<a name="top"></a>

[![MIT License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](LICENCE)

<a name="overview"></a>
# Overview
**This is a GAS library for notifying the change of number of comments, stars and forks of own Gists as an email using Google Apps Script.**

<a name="description"></a>
# Description
Recently, I noticed that when a comment was posted to own Gists, and the numbers of stars and forks of own Gists were changed, the notification mail is not sent. Also I knew that in the current stage, there are no official methods for notifying them, yet. For this situation, I thought an application for notifying them as an email can be created using Google Apps Script, and when such application can be easily to be used, it may be useful for other users. So I created this as a GAS library.

# Library's project key
~~~
1O3lRMPvnjQKWxbXyJcnIGgEiienECajdlfi8dqgR6Kf45A-Wa4wiMpb9
~~~

# How to install
The installation flow is as follows. **This library supposes that you have an account of GitHub.**

1. Install this library
2. Copy and paste a sample script for using this library
3. Install Time-Driven Trigger

## 1. Install this library
At first, please install this library by following flow. In this flow, the container-bound script of Spreadsheet is used.

1. [Login to Google Drive](https://drive.google.com/drive/my-drive), and create new Spreadsheet.
1. Open the Script Editor of Spreadsheet.
1. Open a dialog by "Resources" -> "Libraries".
1. Input library's project key to text box. The library's project key is **``1O3lRMPvnjQKWxbXyJcnIGgEiienECajdlfi8dqgR6Kf45A-Wa4wiMpb9``**.
1. Click "Add" button. You can see this library at above. The title is "GistChecker".
1. Select latest version
1. Developer mode is "ON". (If you don't want to use latest version, select others.)
1. Identifier is "**``GistChecker``**". This is set under the default.

[If you want to read about Libraries, please check this.](https://developers.google.com/apps-script/guide_libraries).

## 2. Copy and paste a sample script for using this library
After installed the library, please copy and paste the following script to the script editor which installed the library.

~~~javascript
function myFunction() {
  var params = {
    email: "###", // This is used for notifying the result.
    username: "###", // This is user name of your GitHub account.
    password: "###", // This is password of your GitHub account.
  };
  var res = GistChecker.Do(params);
  Logger.log(res);
}
~~~

| Property | Description |
|:---|:---|
| **``email``** | Email address for sending the notification when the number of comments in own Gists is changed. (Required) |
| **``username``**, **``password``** | ``username`` and ``password`` of your account using the login to GitHub. (Required)<br>If you want to use the access token, ``username`` and ``password`` are not required.|
| **``accessToken``** | If you want to use the access token retrieved by OAuth, please use this property. At that time, ``username`` and ``password`` are not required.<br>When you want to use the access token, please include ``gist`` in the scopes.
| **``spreadsheetId``** | If you want to use the project of the standalone script type and you want to use other Spreadsheet, please use this. The default situation supposes that this library is used at the project of the container-bound script type. |
| **``log``** | If you want to record the log, please use ``log: true``. The sheet name of log is "Log_GistChecker". The default value is ``false``. |
| **``getStarsAndForks``** | If you want to check the change of stars and forks, please use ``getStarsAndForks: true``. **The default value is ``false``.** |

<br>

> **Here, when you run ``myFunction()`` at the script editor, you can use the library and confirm whether the script works.** In order to regularly run the script, please install the time-driven trigger by following section.

## 3. Install Time-Driven Trigger
In order to regularly check own Gists, the script is required to be run by [the time-driven trigger](https://developers.google.com/apps-script/guides/triggers/installable#time-driven_triggers). Please install the trigger by following flow.

1. On the script editor which installed the library.
1. Open "G Suite Developer Hub" by "Edit" -> "Current project's triggers".
1. Click "Add Trigger".
1. Select ``myFunction`` for ``Choose which function to run``.
    - If you want to use other function name, please modify above sample script and select it here.
1. Select ``Head`` for ``Choose which deployment should run``.
1. Select ``Time-Driven`` for ``Select event source``.
1. Select ``Hour timer`` and ``Every hour`` for ``Select type of time based trigger`` and ``Select hour interval``. This means that the function of ``myFunction()`` is run every 1 hour. You can select freely the time for your situation.
1. Click "Save" button.

Here, all installation for using this library is done. You can close the script editor and logout Google. The function of ``myFunction()`` is automatically run every 1 hour, and when the number of comments were changed, you will receive an notification email.

# Response
## Pattern 1
When the above sample script is run with the default setting, if the comments were not posted from the previous run to this run, the following response is returned. You can retrieve this by ``res`` in the sample script. **As the default, it's ``getStarsAndForks: false``. So the numbers of stars and forks are not retrieved.**

~~~json
{
  "startTime": "2000-01-01T00:00:00.000Z",
  "totalGists": ##,
  "changedGists": 0,
  "executionTime": 1.234
}
~~~

## Pattern 2
When the above sample script is run with ``getStarsAndForks: true``, if the comments were posted to 2 Gists and 1 star and 1 fork were done from the previous run to this run, the following response is returned. You can retrieve this by ``res`` in the sample script.

~~~json
{
  "startTime": "2000-01-01T00:00:00.000Z",
  "totalGists": ##,
  "changedGists": 2,
  "executionTime": 1.234
}
~~~

At that time, you get the following email.

~~~
# Following gists were changed.
# response:
{"startTime":"2000-01-01T00:00:00.000Z","totalGists":##,"changedGists":2}

1. ### Description of Gist ###
   https://gist.github.com/###
   comments: +1
   stars: +1
   forks: 0

2. ### Description of Gist ###
   https://gist.github.com/###
   comments: 0
   stars: 0
   forks: +1
~~~

# About retrieving number of stars and forks from Gists
In the current stage (2019-03-31), unfortunately, there are no methods for retrieving the information of stars and forks of Gists in GitHub API, yet. So in this library, those values are retrieved using the downloaded HTML of Gists. Please be careful this. Because of this situation, I set the default value of ``getStarsAndForks`` as ``false``. If the method for retrieving the information of stars and forks of each Gist is added to GitHub API, I would like to update this library using GitHub API.

# Process cost
In the library of GistChecker, the following flow is used.

1. Retrieve all own Gists using GitHub API.
2. If ``getStarsAndForks`` is ``true``, retrieve all URL and retrieve the numbers of stars and forks.
2. Check the difference of number of comments between new and old data. The old data means the data which were retrieved by the previous run. When ``getStarsAndForks`` is ``true``, the starts and forks are also compared.
3. Overwrite the sheet of "Data_GistChecker" by the retrieved new data.
4. If there are the changes for the numbers of comments (if ``getStarsAndForks`` is ``true``, stars and forks are added.) for each Gist, the information is sent using email.

From this flow, it cannot know the change of Gists with the real time. But it can be achieved by regularly checking it.

I have 141 Gists at 2019-03-31. In my environment, the process times are as follows.

- Checking the change of number of comments: About 3 seconds in the average
- Checking the change of number of comments, stars and forks: About 7 seconds in the average

# Scopes
This library uses the following 3 scopes. These are installed in the library. So users are not required to do anything for this.

- ``https://www.googleapis.com/auth/script.external_request``
- ``https://www.googleapis.com/auth/script.send_mail``
- ``https://www.googleapis.com/auth/spreadsheets``


-----

<a name="Licence"></a>
# Licence
[MIT](LICENCE)

<a name="Author"></a>
# Author
[Tanaike](https://tanaikech.github.io/about/)

If you have any questions and commissions for me, feel free to contact me.

<a name="Update_History"></a>
# Update History
* v1.0.0 (April 1, 2019)

    1. Initial release.



[TOP](#top)
