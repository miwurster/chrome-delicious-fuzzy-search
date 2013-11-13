'use strict';

module.exports = function (grunt) {

    // By default, load all available grunt tasks
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    var appConfig = {
        dir: {
            src: 'app',
            target: 'dist',
            tmp: '.tmp'
        },
        banner: '/*! <%= pkg.name %> | <%= grunt.template.today("yyyy-mm-dd HH:MM") %> */\n'
    };

    grunt.initConfig({
        appConfig: appConfig,
        pkg: grunt.file.readJSON('package.json'),

        clean: {
            options: {
                dot: true
            },
            files: ['<%= appConfig.dir.tmp %>', '<%= appConfig.dir.target %>']
        },

        sass: {
            compile: {
                options: {
                    outputStyle: 'expanded'
                },
                files: {
                    '<%= appConfig.dir.tmp %>/styles/css/app.css': '<%= appConfig.dir.src %>/styles/app.scss'
                }
            }
        },
        cssmin: {
            options: {
                banner: '<%= appConfig.banner %>',
                keepSpecialComments: 0
            }
        },
        htmlmin: {
            release: {
                options: {

                },
                files: [
                    {
                        expand: true,
                        cwd: '<%= appConfig.dir.src %>/views',
                        dest: '<%= appConfig.dir.target %>',
                        src: ['*.html']
                    }
                ]
            }
        },
        uglify: {
            options: {
                banner: '<%= appConfig.banner %>'
            }
        },
        copy: {
            files: {
                files: [
                    {
                        expand: true,
                        dot: true,
                        cwd: '<%= appConfig.dir.src %>',
                        dest: '<%= appConfig.dir.target %>',
                        src: [
                            'manifest.json',
                            'images/**/*'
                        ]
                    }
                ]
            },
            fonts: {
                files: [
                    {
                        expand: true,
                        dot: true,
                        cwd: '<%= appConfig.dir.src %>/bower_components/ionicons',
                        dest: '<%= appConfig.dir.target %>/styles',
                        src: [
                            'fonts/*'
                        ]
                    },
                    {
                        expand: true,
                        dot: true,
                        cwd: '<%= appConfig.dir.src %>/bower_components/bootstrap/dist',
                        dest: '<%= appConfig.dir.target %>/styles',
                        src: [
                            'fonts/*'
                        ]
                    }
                ]
            },
            watch: {
                files: [
                    {
                        expand: true,
                        dot: true,
                        cwd: '<%= appConfig.dir.tmp %>/concat',
                        dest: '<%= appConfig.dir.target %>',
                        src: [
                            'scripts/**/*'
                        ]
                    }
                ]
            }
        },
        concat: {
            // Mostly handled by 'usemin' task
        },
        useminPrepare: {
            options: {
                dest: '<%= appConfig.dir.target %>'
            },
            html: '<%= appConfig.dir.src %>/views/options.html'
        },
        usemin: {
            html: ['<%= appConfig.dir.target %>/{,*/}*.html'],
            css: ['<%= appConfig.dir.target %>/styles/{,*/}*.css'],
            options: {
                dirs: ['<%= appConfig.dir.target %>']
            }
        },
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            files: [
                'Gruntfile.js',
                '<%= appConfig.dir.src %>/scripts/{,*/}*.js'
            ]
        },
        compress: {
            release: {
                options: {
                    archive: '<%= appConfig.dir.target %>/<%= pkg.name %>.zip',
                    mode: 'zip'
                },
                expand: true,
                cwd: '<%= appConfig.dir.target %>',
                src: ['**/*'],
                dest: '/'
            }
        },
        watch: {
            app: {
                files: [
                    '<%= appConfig.dir.src %>/**/*',
                    '!<%= appConfig.dir.src %>/bower_components/**/*',
                    '!<%= appConfig.dir.src %>/images/**/*'
                ],
                tasks: ['compile-watch']
            }
        }
    });

    grunt.registerTask('test', [

    ]);

    grunt.registerTask('compile', [
        'clean',
        'useminPrepare',
        'copy:files',
        'copy:fonts',
        'sass',
        'concat',
        'cssmin',
        'htmlmin',
        'uglify',
        'usemin'
    ]);

    grunt.registerTask('compile-watch', [
        'clean',
        'useminPrepare',
        'copy:files',
        'copy:fonts',
        'sass',
        'concat',
        'cssmin',
        'htmlmin',
        'copy:watch',
        'usemin'
    ]);

    grunt.registerTask('release', [
        'default',
        'compress'
    ]);

    grunt.registerTask('default', [
        'jshint',
        'test',
        'compile'
    ]);
};