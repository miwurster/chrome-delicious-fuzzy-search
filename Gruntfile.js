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
        banner: '/*! <%= pkg.description %> | <%= grunt.template.today("yyyy-mm-dd HH:MM") %> */\n'
    };

    grunt.initConfig({
        appConfig: appConfig,
        pkg: grunt.file.readJSON('package.json'),

        clean: {
            options: {
                dot: true
            },
            target: ['<%= appConfig.dir.tmp %>', '<%= appConfig.dir.target %>']
            // , reset: ['node_modules', 'app/bower_components', '.sass-cache']
        },
        htmlmin: {
            release: {
                options: {

                },
                files: [
                    {
                        expand: true,
                        cwd: '<%= appConfig.dir.src %>',
                        src: ['*.html', 'views/*.html'],
                        dest: '<%= appConfig.dir.target %>'
                    }
                ]
            }
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
        useminPrepare: {
            html: '<%= appConfig.dir.src %>/index.html',
            options: {
                dest: '<%= appConfig.dir.target %>'
            }
        },
        usemin: {
            html: ['<%= appConfig.dir.target %>/{,*/}*.html'],
            css: ['<%= appConfig.dir.target %>/styles/{,*/}*.css'],
            options: {
                dirs: ['<%= appConfig.dir.target %>']
            }
        },
        copy: {
            release: {
                files: [
                    {
                        expand: true,
                        dot: true,
                        cwd: '<%= appConfig.dir.src %>',
                        dest: '<%= appConfig.dir.target %>',
                        src: [
                            'images/**/*',
                            'views/**/*',
                            '*.xml'
                        ]
                    },
                    {
                        expand: true,
                        dot: true,
                        cwd: '<%= appConfig.dir.src %>/bower_components/ionicons',
                        dest: '<%= appConfig.dir.target %>/styles/css',
                        src: [
                            'fonts/*'
                        ]
                    },
                    {
                        expand: true,
                        dot: true,
                        cwd: '<%= appConfig.dir.src %>/bower_components/topcoat',
                        dest: '<%= appConfig.dir.target %>/styles',
                        src: [
                            'font/*'
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
        uglify: {
            options: {
                banner: '<%= appConfig.banner %>'
            }
        },
        processhtml: {
            release: {
                files: {
                    '<%= appConfig.dir.target %>/index.html': ['<%= appConfig.dir.target %>/index.html']
                }
            }
        },
        compress: {
            release: {
                options: {
                    archive: 'dist/<%= pkg.name %>.zip',
                    mode: 'zip'
                },
                expand: true,
                cwd: 'dist/',
                src: ['**/*'],
                dest: '/'
            }
        },
        watch: {
            app: {
                files: [
                    '<%= appConfig.dir.src %>/**/*',
                    '!<%= appConfig.dir.src %>/bower_components/**/*',
                    '!<%= appConfig.dir.src %>/images/**/*',
                    '!<%= appConfig.dir.src %>/styles/font/*'
                ],
                tasks: ['compile-watch'],
                options: {
                    livereload: '<%= connect.options.livereload %>'
                }
            }
        },
        connect: {
            options: {
                port: 9009,
                // Change this to '0.0.0.0' to access the server from outside.
                hostname: 'localhost',
                livereload: 35729
            },
            livereload: {
                options: {
                    open: true,
                    base: [
                        '<%= appConfig.dir.tmp %>',
                        '<%= appConfig.dir.src %>'
                    ]
                }
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
        }
    });

    grunt.registerTask('test', [

    ]);


    grunt.registerTask('compile', [
        'clean:target',
        'useminPrepare',
        'copy:release',
        'sass',
        'concat',
        'cssmin',
        'htmlmin',
        'uglify',
        'usemin',
        'processhtml'
    ]);

    grunt.registerTask('compile-watch', [
        'clean:target',
        'useminPrepare',
        'copy',
        'sass',
        'concat',
        'cssmin',
        'htmlmin',
        'copy:watch',
        'usemin',
        'processhtml'
    ]);

    grunt.registerTask('build', [
        'jshint',
        'test',
        'compile'
    ]);

    grunt.registerTask('release', [
        'build',
        'compress'
    ]);


    grunt.registerTask('server', [
        'connect',
        'watch'
    ]);


    grunt.registerTask('default', [
        'build',
        'server'
    ]);
};