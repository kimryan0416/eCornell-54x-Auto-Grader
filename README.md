# **CIS54x Unit Test Autograder Package - Codio Version**

This package is intended to be used for eCornell's CIS54x online web design course. It contains unit tests intended to be used by the course's Codio environment.

| Option | Type | Default | Description |
|:-------|:-----|:--------|:------------|
|``silent``| boolean | FALSE | Output of the autograder's results in HTML into the console. Highly recommended for Codio activities, otherwise use ``console_silent`` to print autograder results in plain text. |
|``console_silent``| boolean | FALSE | Output of the autograder's results in plain text into the console. Highly recommended for personal builds via Terminal, otherwise use ``silent`` to print autograder results in HTML. |
|``inline_styling``| boolean | TRUE | When printing in HTML, define whether CSS styling should be added as inline styling into the HTML directly - highly recommended to be set to FALSE in Codio activities. |
|``abs_dir`` | string | "./" | The working directory of ``app.js``, ``common.js``, and ``tests/``, if these files are not present within the current working directory - suggested to be set to ".guides/cis54x/" for all Codio activities. |
|``save_html``| boolean | TRUE | Determine if the HTML results of the autograder should be saved as an HTML file (**NOTE:** If set to true, highly recommended to adjust the ``save_with_assignment`` and ``save_dir`` options as well). |
|``save_json``| boolean | TRUE | Determine if the raw results of the autograder should be saved as a JSON file (**NOTE:** If set to true, highly recommended to adjust the ``save_with_assignment`` and ``save_dir`` options as well). |
|``save_dir``| string | "testReport/" | The directory name where the HTML and/or JSON files produced by the autograder should be saved in - only necessary if ``save_html`` and/or ``save_json`` are set to TRUE. |
|``save_with_assignment``| boolean | TRUE | Toggle whether the directory defined with ``save_dir`` is relative to the submission folder of the student or relative to the ``abs_dir``. |
|``timeout``| integer | 20000 | The amount of time allotted to the autograder (in milliseconds) until a timeout response is returned - suggested timeout to be 60000 for Codio activities. |
|``synchronous``| boolean | FALSE | Toggle whether the unit tests should be executed synchronously in the order defined in the ``tests`` array or not - HIGHLY RECOMMENDED if running multiple occurrences of Unit Tests 103 and 202 due to timeout lag in multiple occurrences of these tests |
|``grade``| boolean | FALSE | Toggle to produce a rudimentary grade report based on the results of the unit test. *Still in development* |