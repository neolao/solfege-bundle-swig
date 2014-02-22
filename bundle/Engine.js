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
 * @api     public
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
 * @api     public
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
    // Update the configuration
    swig.setDefaults({
        autoescape: this.configuration.autoescape,
        varControls: this.configuration.varControls,
        tagControls: this.configuration.tagControls,
        cmtControls: this.configuration.cmtControls,
        locals: this.parseVariables(this.configuration.locals),
        cache: (this.configuration.cache)?'memory':false,
        loader: swig.loaders.fs(this.configuration.path)
    });
};

/**
 * Parse the variables
 *
 * @param   {Object}    variables   The variables
 * @return  {Object}                The parsed variables
 * @api     private
 */
proto.parseVariables = function(variables)
{
    var parsedVariables = {};

    // If the variables is not an object, then return an empty parsed variables
    if (typeof variables !== 'object') {
        return parsedVariables;
    }

    // Check each variables
    for (var key in variables) {
        var value = variables[key];
        var computedValue = null;

        // If the value is a string, try to parse it as a Solfege URI
        if (typeof value === 'string') {
            try {
                computedValue = this.application.resolveSolfegeUri(value, this);
            } catch (error) {
                computedValue = null;
            }
            if (computedValue === null) {
                computedValue = value;
            }
        } else {
            computedValue = value;
        }

        // Set the computed value
        parsedVariables[key] = computedValue;
    }

    return parsedVariables;
};

/**
 * Executed when the bundles of the application are initialized
 *
 * @api private
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
 * @api     public
 */
proto.render = function*(path, parameters)
{
    parameters = this.parseVariables(parameters);

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
 * @api     public
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
