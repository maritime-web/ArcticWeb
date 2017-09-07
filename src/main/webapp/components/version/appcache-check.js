(function () {
    'use strict';

    appcacheCheck();

    function appcacheCheck() {

        var appCache = window.applicationCache;

        function handleCacheEvent(e) {
            console.log(e.type.toUpperCase());
        }

        function swapAndReload() {
            console.log('APPCACHE SWAPPING');
            appCache.swapCache();
            console.log('RELOADING PAGE');
            window.location.reload();
        }

        if (appCache) {
            if (appCache.status === appCache.IDLE) {
                appCache.update();
            }
            if (appCache.status === appCache.UPDATEREADY) {
                // Browser downloaded a new app cache.
                swapAndReload();
            }

            // Fired when the manifest resources have been newly redownloaded.
            appCache.addEventListener('updateready', function (e) {
                handleCacheEvent(e);
                if (appCache.status === appCache.UPDATEREADY) {
                    // Browser downloaded a new app cache.
                    swapAndReload();
                }
            });

            // The manifest returns 404 or 410, the download failed,
            // or the manifest changed while the download was in progress.
            appCache.addEventListener('error', function (e) {
                console.error(e);
                console.error(getStatus());
            });

            // Fired after the first cache of the manifest.
            appCache.addEventListener('cached', function (e) {
                handleCacheEvent(e);
                console.log('CACHED FIRST TIME INITIATE CHECK FOR NEW UPDATE');
                appCache.update();
            });

            // Checking for an update. Always the first event fired in the sequence.
            // appCache.addEventListener('checking', handleCacheEvent, false);

            // An update was found. The browser is fetching resources.
            // appCache.addEventListener('downloading', handleCacheEvent, false);

            // Fired after the first download of the manifest.
/*
            appCache.addEventListener('noupdate', function (e) {
                handleCacheEvent(e);
            });
*/

            // Fired if the manifest file returns a 404 or 410.
            // This results in the application cache being deleted.
            // appCache.addEventListener('obsolete', handleCacheEvent, false);

            // Fired for each resource listed in the manifest as it is being fetched.
            // appCache.addEventListener('progress', handleCacheEvent, false);
        }

        function getStatus() {
            switch (appCache.status) {
                case appCache.UNCACHED: // UNCACHED == 0
                    return 'UNCACHED';
                    break;
                case appCache.IDLE: // IDLE == 1
                    return 'IDLE';
                    break;
                case appCache.CHECKING: // CHECKING == 2
                    return 'CHECKING';
                    break;
                case appCache.DOWNLOADING: // DOWNLOADING == 3
                    return 'DOWNLOADING';
                    break;
                case appCache.UPDATEREADY:  // UPDATEREADY == 4
                    return 'UPDATEREADY';
                    break;
                case appCache.OBSOLETE: // OBSOLETE == 5
                    return 'OBSOLETE';
                    break;
                default:
                    return 'UKNOWN CACHE STATUS';
                    break;
            }
        }
    }
})();