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

    // Parse the configuration
    this.parseConfiguration();

}, 'solfege.bundle.swig.Engine');
var proto = Engine.prototype;

/**
 * The configuration
 *
 * @type {Object}
 * @api private
 */
proto.configuration;

/**
 * Override the current configuration
 *
 * @param   {Object}    customConfiguration     The custom configuration
 * @api public
 */
proto.overrideConfiguration = function*(customConfiguration)
{
    this.configuration = solfege.util.Object.merge(this.configuration, customConfiguration);

    // Parse the configuration
    this.parseConfiguration();
};

/**
 * Parse the configuration and initialize properties
 *
 * @api private
 */
proto.parseConfiguration = function()
{
    swig.setDefaults({
        autoescape: this.configuration.autoescape,
        varControls: this.configuration.varControls,
        tagControls: this.configuration.tagControls,
        cmtControls: this.configuration.cmtControls,
        locals: this.configuration.locals,
        cache: (this.configuration.cache)?'memory':false,
        loader: swig.loaders.fs(this.configuration.path)
    });
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
