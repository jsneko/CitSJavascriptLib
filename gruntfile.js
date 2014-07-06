/**
 * Created by wweithers on 6/28/2014.
 */

grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
        utils: {
            'dest/utils.min.js': ['lib/utils.js']
        },
        aop: {
            'dest/aop.min.js': ['lib/utils/aopproxy.js', 'lib/utils/executionevent.js', 'lib/utils/proxymanager.js']
        }
    }
});