module.exports = {
    // Templates path
    path: __dirname + '/../templates',

    // Indicates that the variable is escaped for safe HTML ouput
    // - true
    // - false
    autoescape: true,

    // Open and close controls for variables
    varControls: ['{{', '}}'],

    // Open and close controls for tags
    tagControls: ['{%', '%}'],

    // Open and close controls for comments
    cmtControls: ['{#', '#}'],

    // Cache the template files
    // - true
    // - false
    cache: true,

    // Available variables and methods in all templates
    locals: {}
};
