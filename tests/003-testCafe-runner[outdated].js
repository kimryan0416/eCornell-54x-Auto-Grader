import { Selector, ClientFunction } from 'testcafe';

var thisSelector = process.env.SELECTOR;
var thisFile = process.env.FILE;

fixture (`fixture`)
    .page('http://localhost:8080/'+thisFile);

test(thisFile, async t => {
        var elements      = Selector(thisSelector);
        var count         = await elements.count;
        var requestsCount = 0;
        var statuses      = [];

        var getRequestResult = ClientFunction(url => {
            return new Promise(resolve => {
                var xhr = new XMLHttpRequest();

                xhr.open('GET', url);

                xhr.onload = function () {
                    resolve(xhr.status);
                };

                xhr.send(null);
            });
        });


        for (var i = 0; i < count; i++) {
            var srcUrl = await elements.nth(i).getAttribute('src');
            var hrefUrl = await elements.nth(i).getAttribute('href');

            if (srcUrl && !srcUrl.startsWith('data')) {
                requestsCount++;
                statuses.push({
                  src:srcUrl,
                  res:await getRequestResult(srcUrl)
                });
            }
            else if (hrefUrl && !hrefUrl.startsWith('data')) {
                requestsCount++;
                statuses.push({
                  src:hrefUrl,
                  res:await getRequestResult(hrefUrl)
                });
            }
        }

        await t.expect(requestsCount).eql(statuses.length);

        for (const status of statuses)
            await t.expect(status.res).eql(200,JSON.stringify(statuses));
});