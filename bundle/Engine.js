var solfege = require('solfegejs');
var swig = require('swig');

/**
 * The swig engine
 *
 * @see http://paularmstrong.github.io/swig/docs/api/
 */
var Engine = solfege.util.Class.create(function()
{
    // Set the default configuration
    this.configuration = require('../configuration/default.js');

}, 'solfege.bundle.swig.Engine');
var proto = Engine.prototype;


/**
 * The application instance
 *
 * @type {solfege.kernel.Application}
 * @api private
 */
proto.application;

/**
 * The configuration
 *
 * @type {Object}
 * @api private
 */
proto.configuration;

/**
 * Set the application
 *
 * @param   {solfege.kernel.Application}    application     Application instance
 */
proto.setApplication = function*(application)
{
    this.application = application;

    // Set listeners
    var bindGenerator = solfege.util.Function.bindGenerator;
    this.application.on(solfege.kernel.Application.EVENT_BUNDLES_INITIALIZED, bindGenerator(this, this.onBundlesInitialized));
};

/**
 * Override the current configuration
 *
 * @param   {Object}    customConfiguration     The custom configuration
 * @api public
 */
proto.overrideConfiguration = function*(customConfiguration)
{
    this.configuration = solfege.util.Object.merge(this.configuration, customConfiguration);
};

/**
 * Parse the configuration and initialize properties
 *
 * @api private
 */
proto.parseConfiguration = function()
{
    // Parse the locals
    var locals = {};
    for (var localKey in this.configuration.locals) {
        var localValue = this.configuration.locals[localKey];
        var computedValue = null;

        // If the value is a string, try to parse it as a Solfege URI
        if (typeof localValue === 'string') {
            try {
                computedValue = this.application.parseSolfegeUri(localValue, this);
            } catch (error) {
                computedValue = null;
            }
            if (computedValue === null) {
                computedValue = localValue;
            }
        } else {
            computedValue = localValue;
        }

        // Set the computed value
        locals[localKey] = computedValue;
    }


    // Update the configuration
    swig.setDefaults({
        autoescape: this.configuration.autoescape,
        varControls: this.configuration.varControls,
        tagControls: this.configuration.tagControls,
        cmtControls: this.configuration.cmtControls,
        locals: locals,
        cache: (this.configuration.cache)?'memory':false,
        loader: swig.loaders.fs(this.configuration.path)
    });
};

/**
 * Executed when the bundles of the application are initialized
 */
proto.onBundlesInitialized = function*()
{
    // Parse the configuration
    this.parseConfiguration();
};


/**
 * Render a file
 *
 * @param   {String}    path        The file path
 * @param   {Object}    parameters  The parameters
 * @return  {String}                The result
 */
proto.render = function*(path, parameters)
{
    var output = yield function(done) {
        swig.renderFile(path, parameters, function(error, result) {
            // An error occurred
            if (error) {
                // @todo Handle error
                console.error('Unable to render ' + path);
            }

            done(error, result);
        });
    };

    return output;
};

/**
 * The server middleware
 *
 * @param   {solfege.bundle.server.Request}     request     The request
 * @param   {solfege.bundle.server.Response}    response    The response
 * @param   {GeneratorFunction}                 next        The next function
 */
proto.middleware = function*(request, response, next)
{
    var self = this;

    // Add the "render" method in the response
    response.render = function*(path)
    {
        var result = yield self.render(path, response.parameters);
        response.body = result;
    };

    yield *next;
};

module.exports = Engine;
