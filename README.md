# CIS54x Unit Test Autograder

The **CIS54x Unit Test Autograder** is a Node.JS-based program that allows users to perform unit tests on web files. The Autograder has the ability to parse though and test the functionality, appearance, and content of HTML, CSS, and JavaScript files.

## Table of Contents

1. Prerequisite Programs and Packages
2. Basic Setup
	1. File Setup
	2. "tests.json" Setup
	3. Unit Test Setup
3. How the Autograder Works
4. Other Documentation

## 1) Prerequisite Programs and Packages

This program can work on any local or virtual machine that has the following programs installed:

* Node.JS and npm
* Java (001, 101)
* Mocha
* TestCafe
* http-server
* Google Chrome

## 2) Basic Setup:

Setting up the Autograder to perform as expected requires some careful management of files and student submissions.

### File Setup

The initial package contains 5 essential files and 1 directory:
* ``app.js``
* ``common.js``
* ``cis54x-styles.css``
* ``cis54x-template.html``
* ``package.json``
* ``tests/``

To set up the autograder, follow these directions:

1. Copy the 6 items mentioned above to a directory of your choice on your local or virtual machine
2. Using a Unix-oriented Command Line Terminal (i.e. Bash Terminal on Windows, Terminal on MacOSX), modify the current working directory to a location where it is easy to access both ``app.js`` and any student submissions you wish to grade.
3. Install the necessary Node.JS packages by executing the following command:

````
npm install
```` 

The Autograder also requires several an additional component to get it started: ``tests.json``. This file is a custom JSON file that controls the options for each autograding session and indicates which web files the autograder should inspect. 

### "tests.json" Setup

The ``tests.json`` file is a file that tells the autograder how to behave and which unit tests to use when evaluating web files. It does not necessarily need to be named ``tests.json``, but it is a JSON document nonetheless - for the sake of this readme, we will continuously refer to it as ``tests.json``.

The ``tests.json`` file contains 3 major components:

* **name**: The name of the current testing session. This is important when grading assignments, as multiple test files can be used for a single assignment and names are a way to individualize each testing session.
* **options**: The options of the current grading session. Controls various aspects of the grading session.
* **tests**: a list of all the unit tests that will be performed during a grading session. Each unit test has its own unique variables and settings.

As of the latest release of the autograder, the following options can be modified within ``tests.json``;

| Option 	| Type | Default | Description |
|:-------	|:-----|:--------|:------------|
|``silent``	| boolean | FALSE | Output of the autograder's results in HTML into the console. Only recommended if you will be parsing the console output as HTML (such as in the case with online IDE's such as Codio); otherwise use ``console_silent`` to print autograder results in plain text. |
|``console_silent``| boolean | FALSE | Output of the autograder's results in plain text into the console. Highly recommended for personal builds on local machines using Terminal, otherwise use ``silent`` to print autograder results in HTML. |
|``inline_styling``| boolean | TRUE | When printing in HTML, define whether CSS styling should be added as inline styling into the HTML directly - if set to TRUE, it will read ``cis54x-styles.css`` and use that to refer to how to style the HTML output. |
|``abs_dir`` | string | "./" | The path to the current directory of ``app.js``, ``common.js``, ``cis54x-styles.css``, ``cis54x-template.html``, and ``tests/``, if these files are not present within the current working directory. |
|``save_html``| boolean | TRUE | Determine if the HTML results of the autograder should be saved as an HTML file (**NOTE:** If set to true, highly recommended to adjust the ``save_with_assignment`` and ``save_dir`` options as well). |
|``save_json``| boolean | TRUE | Determine if the raw results of the autograder should be saved as a JSON file (**NOTE:** If set to true, highly recommended to adjust the ``save_with_assignment`` and ``save_dir`` options as well). |
|``save_dir``| string | "testReport/" | The directory name where the HTML and/or JSON files produced by the autograder should be saved in - only necessary if ``save_html`` and/or ``save_json`` are set to TRUE. |
|``save_with_assignment``| boolean | TRUE | Toggle whether the directory defined with ``save_dir`` is relative to the submission folder of the student or relative to the ``abs_dir``. |
|``timeout``| integer | 20000 | The amount of time allotted to the autograder (in milliseconds) until a timeout response is returned. |
|``synchronous``| boolean | FALSE | Toggle whether the unit tests should be executed synchronously in the order defined in the ``tests`` array or not - HIGHLY RECOMMENDED if running multiple occurrences of Unit Tests 103 and 202 due to timeout lag in multiple occurrences of these tests. |
|``grade``| boolean | FALSE | Toggle to produce a rudimentary grade report based on the results of the unit test. Produces a new ``gradeReport.json`` that congregates all the tests run on a single website. If test results for a session with the same test **name** are found within this file, the results of the current testing session will overwrite the old test session results. |

By having these options defined within ``tests.json``, you may create different scenarios and grading options for each unique student submission.

### Unit Test Setup

As mentioned above, the Autograder will perform specific unit tests on a website's root folder. You can control which unit tests will be performed by modifying the **tests** array within ``tests.json``.

Each unit test has a unique set of variables and options that are self-contained and modify the behavior of each unit test. For more details on which aspects of each unit test you can modify, please look within the provided ``documentation`` folder for a file called ``testDetails.md``.

However, each test does have a basic list of values you can adjust for each unit test used. All unit tests listed in **tests** has a basic framework shown below:

````json
{
	"name":"The name of the unit test - only for organization purposes",
	"test":"path/to/testfile.js",	// Required
	"title":"The printed title of the unit test - printed into the terminal and HTML output - most unit tests have a default printed title, but setting this value will override any default titles",
	"message":"The error message that ought to be printed should a unit test return an error - most unit tests have a default error message, but setting this value will override any default error messages",
	"variables":{}
}
````

Since **tests** within ``tests.json`` is an array, you may use multiple unit tests at once, using this framework for each unit tst within **tests**. Pay close attention to the **variables** object list above: this is contain all the modifications and tweaks unique to each unit test. Once again, please look within the provided ``documentation`` folder for a file called ``testDetails.md`` to learn about these variables and constraints.

## 3) How the Autograder Works

In order to initialize the Autograder, you need to execute a bash command:

````
env TESTS=[path/to/tests.json] node [path/to/app.js]
````

The Autograder will take in an environment variable TESTS and use the options within to determine several key details, such as:

* Should the Autograder print out into the console in HTML or plain text?
* Should the Autograder use inline-styling if printing any HTML results?
* Should the Autograder print out an HTML and/or JSON file that contains test results?
* Where is ``app.js`` relative to the current working directory?
* If printing any results into an HTML or JSON file, which directory should the Autograder print the files and is that directory's path relative to the student submission or not?
* Should the tests run sychronously or asynchronously?
* Should the Autograder add these results to a ``gradeReport.json`` file?

After making these determinations, the Autograder will run the unit tests defined within the ``tests.json``'s **tests** list on a website's root folder. 

After running these tests, depending on what was determined above, results will be printed where defined. 

## 4) Other Documentation

To know about the variables unique to each unit test, read the document named ``testDetails.md`` that is located within the ``documentation`` folder.

To know about how to utilize the Autograder for use on **Codio**, an online IDE's that allows for students to work on code projects online through virtual machines, please read the document named ``codioGuide.md`` located within the ``documents`` folder.

If you have any questions on how to customize the Autograder for your personal usage, please contact me directly via email, which is available on [my website]("https://ryankimdev.com"). 


*This package is intended to be used for eCornell's CIS54x online web design course.*

