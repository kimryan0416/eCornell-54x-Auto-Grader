# Guide to Setting up the Autograder For Codio Usage

## **1) Setting Up a Codio Activity**

The eCornell organization on Codio requires that coding activities are created as projects. Every project requires a "stack," or a collection of programs that come pre-installed into a project upon first creating said project.

The eCornell CIS 54x has its own custom stack titled **CIS54xDev Ver.2** that contains necessary programs that are used by the Autograder. The programs that come with this stack are:

* Node.JS and npm
* Java (001, 101)
* Mocha
* TestCafe
* http-server
* Google Chrome

In order to create a project within Codio for the CIS 54x online course, you must follow these step.
**Note**: Also ensure that you are part of the eCornell Organization on Codio. Otherwise, you will not have access to the CIS54x Dev stack.

1. Log into Codio
2. From the main homepage of your Codio account, navigate to ``Courses``, then to ``Organizations`` on the top tab. You should find yourself a list of courses affiliated with the eCornell Organization on Codio.
3. Scroll to the course you wish to create a coding activity for, and click it.
4. If you need to create a new module, do so - otherwise, click on the module the coding activity should be a part of.
5. Click the "+" sign to create a new activity. Make sure to click ``Project based unit`` from the dropdown.
6. Look at the partition titled "*Important*" - Click the blue link that follows "*If you want to create a new empty project with a custom stack not listed above*".
7. On the "Empty with Stack" option given, browse for the latest version of ``CIS54xDev Ver.2`` stack.
8. Proceed with the rest of the instructions on the page to create a project.

When you load up the new project, you should already have all the necessary base programs automatically available to you in the project.

---

## **2) Base Installation into Codio**

Upon creating a new project or when you are in the editor mode of your project, you must upload the CIS 54x Unit Test Autograder Package directly into the package.

1. Within ``.guides`` directory available in Editor mode, create a new cis-specific folder and name it whichever (recommended: "cis54x")

2. Copy the files contained within this directory into the new folder, organized to the extent described below:
	- .guides
		- styles.css
		- cis54x
			- app.js
			- common.js
			- package.json
			- assessment/
				- tests.json
			- tests/
				- (any unit test .js files you need)
				- vnu.jar (if using tests 001 and 101)


3. Using the Terminal tool, change your working directory into the new cis-specific folder. For example:
````
cd .guides/cis54x/
````

4. Install the necessary node modules by entering the following command into the Terminal:
````
npm install
````

---

## **3) Adding Unit Tests into "tests.json"**

The file ``tests.json`` is the file that will direct how the autograder performs on Codio. Within this file, the content is a JSON object that is organized as such:

````
{
	"name":"",		// The name of the autograder's assessment - important for grading purposes
	"options":{},	// A Dictionary of options that control certain properties and behavior of the autograder
	"tests":[]		// A List of unit tests that the autograder must perform
}
````

Using these three key-value pairs, one can control the behavior of the autograder in its entirety.

### "name": string

This does not serve much of a purpose outside of providing a grading report if defined within ``options``. It is possible to have multiple assessments within the same Codio project - having a name unique to each ``tests.json`` is a viable option for organizing test content.

### "options": object

This JSON object controls much of the behavior of the autograder. The full description of which option affects which aspect of the autograder is defined within the README file of this repository. This guide assumes that a basic understanding of what these options do has already been achieved.

The suggested settings for Codio activities has been described below:

| Option 					| Type 		| Default 		| Suggested Value |
|:-------					|:-----		|:--------		|:----------------|
|``silent``					| boolean 	| FALSE 		| FALSE |
|``console_silent``			| boolean 	| FALSE 		| TRUE |
|``inline_styling``			| boolean 	| TRUE 			| FALSE |
|``abs_dir`` 				| string 	| "./" 			| ".guides/cis54x/" |
|``save_html``				| boolean 	| TRUE 			| FALSE |
|``save_json``				| boolean 	| TRUE 			| FALSE |
|``save_dir``				| string 	| "testReport/" | "assessment/testReport/" |
|``save_with_assignment``	| boolean 	| TRUE 			| FALSE |
|``timeout``				| integer 	| 20000 		| 60000 |
|``synchronous``			| boolean 	| FALSE 		| FALSE (*HIGHLY RECOMMENDED to set to TRUE if running multiple occurrences of Unit Tests 103 and 202 due to timeout lag*) |
|``grade``					| boolean 	| FALSE 		| FALSE |

### "tests": array

This guide assumes that you understand what each unit test's setup is like.

For Codio to properly run each unit test properly, you must pay attention to the paths defined within each unit test. An example has been provided below:

````
{
	"name":"001-validate-html",
	"test":"./tests/001-validate-html.js",		// This value is relative to "app.js" in Codio
	"title":"Expecting no HTML errors.",
	"variables":{
		"HTML_PATH":"assignment/",		// This value is relative to the root directory, or the parent directory of ".guides/"
		"SUPPRESS":false
	}
}
````

In the example above:
* ``"test":"./tests/001-validate-html.js"``: This value is relative to ``app.js`` in Codio
* ``"HTML_PATH":"assignment/"``: This value is relative to the root directory, or the parent directory of ``.guides/``

A general understanding of where relativity is important is thus:
1. If defining the path to the unit test file, it is relative to ``app.js``.
2. If defining a path in "variables", it is relative to the root directory, or the parent directory of ``.guides/``

---

## **4) Creating an Assessment within Codio**

Codio allows an editor to create two types of assessments. This package would require the use of the Advanced Assessment Creator.

1. From the Editor, click the "horse" image and select "Advanced Assessment Test"
2. Name and describe the test whichever way you wish
3. Within the "Command Line" input, type in the following:
		env TESTS=.guides/cis54x/tests.json node .guides/cis54x/app.js
	- All paths should be treated as if the command was executed from the root directory, aka the parent directory of ``.guides/``
4. Save the assessment

If all paths have been properly defined in Step 3, then the assessment should run properly.
