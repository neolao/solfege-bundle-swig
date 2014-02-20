var solfege = require('solfegejs');
var co = require('co');
var expect = require('chai').expect;

/**
 * Test the Engine class
 */
describe('Engine', function()
{
    var Application = solfege.kernel.Application;
    var Engine = require('../bundle/Engine');
    var application;
    var engine;

    /**
     * Initialize the test suite
     */
    before(co(function*()
    {
        // Initialize the application
        application = new Application(__dirname);

        // Add the engine as a bundle
        engine = new Engine();
        application.addBundle('swig', engine);

        // Add a fake bundle to test the Solfege URI
        application.addBundle('fake', {
            transform: function(source) {
                return '--' + source + '--';
            }
        });

        // Override the configuration
        application.overrideConfiguration({
            swig: {
                path: __dirname + '/templates',
                locals: {
                    trans: '@fake.transform'
                }
            }
        });

        // Start the application
        application.start();
    }));


    /**
     * Test the render() function
     */
    describe('#render()', co(function*()
    {
        // Simple template
        it('should render a simple template', co(function*()
        {
            var html = yield engine.render('simple.swig');
            expect(html).to.equal('<h1>Hello</h1>\n');
        }));

        // Simple local variables
        it('should render simple local variables', co(function*()
        {
            var html = yield engine.render('variables.swig', {
                testString: "hello",
                testNumber: 42
            });
            expect(html).to.equal('<ul>\n    <li>hello</li>\n    <li>42</li>\n</ul>\n');
        }));

        // Global function from a another bundle
        it('should include function from Solfege URI in the global variables', co(function*()
        {
            var html = yield engine.render('globalFunction.swig');
            expect(html).to.equal('<p>--mutation--</p>\n');
        }));

        // Local function from a another bundle
        it('should include function from Solfege URI in the local variables', co(function*()
        {
            var html = yield engine.render('localFunction.swig', {
                moo: '@fake.transform'
            });
            expect(html).to.equal('<p>--mutation--</p>\n');
        }));

    }));
});
