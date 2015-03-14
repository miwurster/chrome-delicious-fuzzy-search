'use strict';

module.exports = function (grunt) {

    // By default, load all available grunt tasks
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    var taskConfig = {

        pkg: grunt.file.readJSON('package.json'),

        clean: {
            options: {
                dot: true
            },
            all: [ 'build' ]
        },
        compress: {
            dist: {
                options: {
                    archive: 'build/<%= pkg.name %>.zip',
                    mode: 'zip'
                },
                src: ['**/*'],
                dest: '/',
                cwd: 'app',
                expand: true
            }
        },
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            files: [
                'Gruntfile.js',
                'app/**/*.js',
                '!app/js/vendor/**/*.js'
            ]
        }
    };

    grunt.initConfig(taskConfig);

    grunt.registerTask('default', [
        'jshint',
        'clean',
        'compress'
    ]);
};