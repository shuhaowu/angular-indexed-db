/// Copyright 2013 Shuhao Wu
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///     http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.

'use strict';

(function() {
  var angularIndexedDb = angular.module('angularIndexedDb', []);

  angularIndexedDb.factory('angularIndexedDb', ['$q', '$rootScope', function($q, $rootScope) {

    if (!$rootScope.$safeApply) {
      // From https://coderwall.com/p/ngisma
      $rootScope.$safeApply = function(fn) {
        var phase = this.$root.$$phase;
        if (phase == '$apply' || phase == '$digest') {
          if (fn) {
            fn();
          }
        } else {
          this.$apply(fn);
        };
      };
    }

    var genericSuccess = function(deferred) {
      return function(e) {
        $rootScope.$safeApply(function() {
          deferred.resolve(e.target.result);
        });
      };
    };

    var genericError = function(deferred) {
      return function(e) {
        $rootScope.$safeApply(function() {
          deferred.reject(e.target.error);
        });
      };
    };

    var Index = function(idbIndex) {
      this._index = idbIndex;
      this.name = idbIndex.name;
      this.objectStore = idbIndex.objectStore;
      this.keyPath = idbIndex.keyPath;
      this.multiEntry = idbIndex.multiEntry;
      this.unique = idbIndex.unique;
    };

    Index.prototype.openCursor = function(range, direction) {
      direction = direction || "next";

      // A fake promise that we can resolve multiple times because the way
      // that we do cursors in IndexedDB is horribly broken.
      var cursorPromise = {
        then: function(successHandler, errorHandler) {
          if (successHandler) {
            this._successHandler = successHandler;
          }

          if (errorHandler) {
            this._errorHandler = errorHandler;
          }
        },
        _successHandler: function() {},
        _errorHandler: function() {}
      };

      var request = this._index.openCursor(range, direction);
      request.onsuccess = function(e) {
        cursorPromise._successHandler(request.result);
      };
      request.onerror = function(e) {
        cursorPromise._errorHandler(request.error);
      }

      return cursorPromise;
    };

    Index.prototype.openKeyCursor = function(range, direction) {
      direction = direction || "next";

      // A fake promise that we can resolve multiple times because the way
      // that we do cursors in IndexedDB is horribly broken.
      var cursorPromise = {
        then: function(successHandler, errorHandler) {
          if (successHandler) {
            this._successHandler = successHandler;
          }

          if (errorHandler) {
            this._errorHandler = errorHandler;
          }
        },
        _successHandler: function() {},
        _errorHandler: function() {}
      };

      var request = this._index.openKeyCursor(range, direction);
      request.onsuccess = function(e) {
        cursorPromise._successHandler(request.result);
      };
      request.onerror = function(e) {
        cursorPromise._errorHandler(request.error);
      }

      return cursorPromise;
    };

    Index.prototype.get = function(key) {
      var deferred = $q.defer();

      var request = this._index.get(key);
      request.onsuccess = genericSuccess(deferred);
      request.onerror = genericError(deferred);

      return deferred.promise;
    };

    Index.prototype.getKey = function(key) {
      var deferred = $q.defer();

      var request = this._index.getKey(key);
      request.onsuccess = genericSuccess(deferred);
      request.onerror = genericError(deferred);

      return deferred.promise;
    };

    Index.prototype.count = function(key) {
      var deferred = $q.defer();

      var request = this._index.count(key);
      request.onsuccess = genericSuccess(deferred);
      request.onerror = genericError(deferred);

      return deferred.promise;
    };

    // Object store implementation...
    var ObjectStore = function(idbObjectStore) {
      this._objectStore = idbObjectStore;
      this.name = idbObjectStore.name;
      this.keyPath = idbObjectStore.keyPath;
      this.indexNames = idbObjectStore.indexNames;
      this.transaction = idbObjectStore.transaction;
      this.autoIncrement = idbObjectStore.autoIncrement;

      // Again to conform to w3c...
      this._indexCache = {};
    };

    // TODO: implement add. Add do not overwrite.

    ObjectStore.prototype.put = function(value, key) {
      var deferred = $q.defer();

      var request = this._objectStore.put(value, key);
      request.onsuccess = genericSuccess(deferred);
      request.onerror = genericError(deferred);

      return deferred.promise;
    };

    ObjectStore.prototype.delete = function(key) {
      var deferred = $q.defer();

      var request = this._objectStore.delete(key);
      request.onsuccess = genericSuccess(deferred);
      request.onerror = genericError(deferred);

      return deferred.promise;
    };

    ObjectStore.prototype.get = function(key) {
      var deferred = $q.defer();

      var request = this._objectStore.get(key);
      request.onsuccess = genericSuccess(deferred);
      request.onerror = genericError(deferred);

      return deferred.promise;
    };

    ObjectStore.prototype.clear = function() {
      var deferred = $q.defer();

      var request = this._objectStore.clear();
      request.onsuccess = genericSuccess(deferred);
      request.onerror = genericError(deferred);

      return deferred.promise;
    };

    ObjectStore.prototype.openCursor = function(range, direction) {
      direction = direction || "next";

      // A fake promise that we can resolve multiple times because the way
      // that we do cursors in IndexedDB is horribly broken.
      var cursorPromise = {
        then: function(successHandler, errorHandler) {
          if (successHandler) {
            this._successHandler = successHandler;
          }

          if (errorHandler) {
            this._errorHandler = errorHandler;
          }
        },
        _successHandler: function() {},
        _errorHandler: function() {}
      };

      var request = this._objectStore.openCursor(range, direction);
      request.onsuccess = function(e) {
        cursorPromise._successHandler(request.result);
      };
      request.onerror = function(e) {
        cursorPromise._errorHandler(request.error);
      }

      return cursorPromise;
    };

    ObjectStore.prototype.createIndex = function(name, keyPath, optionalParameters) {
      var idbIndex = this._objectStore.createIndex(name, keyPath, optionalParameters);
      return new Index(idbIndex);
    };

    ObjectStore.prototype.index = function(name) {
      if (name in this._indexCache) {
        return this._indexCache[name];
      } else {
        return (this._indexCache[name] = new Index(this._objectStore.index(name)));
      }
    };

    ObjectStore.prototype.deleteIndex = function(name) {
      this._objectStore.deleteIndex(name);
    };

    ObjectStore.prototype.count = function(key) {
      var deferred = $q.defer();

      var request = this._objectStore.count(key);
      request.onsuccess = genericSuccess(deferred);
      request.onerror = genericError(deferred);

      return deferred.promise;
    };

    var Transaction = function(idbTransaction) {
      this._transaction = idbTransaction;
      this.db = idbTransaction.db;
      this.mode = idbTransaction.mode;

      // This is to conform to the w3c standard.
      this._objectStoreCache = {};
    };

    // This is a method as error could change.
    Transaction.prototype.error = function() {
      return this._transaction.error;
    };

    Transaction.prototype.objectStore = function(name) {
      if (name in this._objectStoreCache) {
        return this._objectStoreCache;
      } else {
        return (this._objectStoreCache[name] = new ObjectStore(this._transaction.objectStore(name)));
      }
    };

    Transaction.prototype.abort = function() {
      this._transaction.abort();
      this._objectStoreCache = {};
    };

    // TODO: How to make sure Transaction.onsuccess and such works?

    var Database = function(idbDb) {
      this._db = idbDb;
      this.name = idbDb.name;
      this.version = idbDb.version;
      this.objectStoreNames = idbDb.objectStoreNames;
    };

    Database.prototype.createObjectStore = function(name, parameters) {
      var store = this._db.createObjectStore(name, parameters);
      return new ObjectStore(store);
    };

    Database.prototype.deleteObjectStore = function(name) {
      this._db.deleteObjectStore(name);
    };

    Database.prototype.transaction = function(storeNames, mode) {
      mode = mode || 'readonly';
      var transaction = this._db.transaction(storeNames, mode);
      return new Transaction(transaction);
    };

    Database.prototype.close = function() {
      this._db.close();
    };

    return {
      open: function(name, version, onupgrade) {
        var deferred = $q.defer();

        var request = window.indexedDB.open(name, version);

        request.onsuccess = function(e) {
          $rootScope.$safeApply(function() {
            var database = new Database(request.result);
            deferred.resolve(database);
          });
        };

        request.onerror = request.onblocked = genericError(deferred);

        request.onupgradeneeded = function(e) {
          onupgrade(new Database(request.result));
        };


        return deferred.promise;
      },
      deleteDatabase: function(name) {
        var deferred = $q.defer();

        var request = window.indexedDB.deleteDatabase(name);

        request.onsuccess = genericSuccess(deferred);
        request.onerror = request.onblocked = genericError(deferred);

        return deferred.promise;
      },
      cmp: function(first, second) {
        return window.indexedDB.cmp(first._db, second._db);
      }
    };

  }]);

})();
