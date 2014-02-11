//
// Copyright (c) Microsoft and contributors.  All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//
// See the License for the specific language governing permissions and
// limitations under the License.
//

var __ = require('underscore');
var util = require('util');

var profile = require('../util/profile');
var utils = require('../util/utils');

var $ = utils.getLocaleString;

exports.init = function (cli) {
  var log = cli.output;

  var account = cli.category('account');
  var environment = account.category('env')
    .description($('Commands to manage your account environment'));

  environment.command('list')
    .description($('List the environments'))
    .execute(function (options, callback) {
      var environments = profile.current.environments;

      if (log.format().json) {
        log.json(environments);
      } else {
        log.table(Object.keys(environments), function (row, s) {
          row.cell('Name', s);
        });
      }

      callback();
    });

  environment.command('show [environment]')
    .description($('Show an environment'))
    .option('--environment <environment>', $('the environment name'))
    .execute(function (environment, options, _) {
      environment = cli.interaction.promptIfNotGiven('Environment name: ', environment, _);

      var existingEnvironment = profile.current.getEnvironment(environment);

      if (!existingEnvironment) {
        throw new Error(util.format($('Unknown environment %s'), environment));
      } else {
        if (log.format().json) {
          log.json(existingEnvironment);
        } else {
          __.keys(existingEnvironment).forEach(function (propertyName) {
            var prop = existingEnvironment[propertyName];
            if (prop === null || __.isUndefined(prop)) {
              prop = "";
            }
            log.data(util.format('Environment %s ', propertyName), prop);
          });
        }
      }
    });

  function validateRequiredOptions(fields, options) {
    Object.keys(fields).forEach(function (fieldName) {
      if (!options[fieldName]) {
        throw new Error(util.format($(fields[fileName])));
      }
    });
  }

  var envFieldsToOptionsFields = [
    ['publishingProfileUrl', 'publishSettingsFileUrl'],
    ['portalUrl', 'managementPortalUrl'],
    ['managementEndpointUrl', 'serviceEndpoint'],
    ['storageEndpoint', 'storageEndpoint'],
    ['sqlManagementEndpointUrl', 'sqlDatabaseEndpoint']
  ];

  function safeOptions(options) {
    return __.reduce(envFieldsToOptionsFields, function (memo, keys) {
      if (options[keys[1]]) {
        memo[keys[0]] = options[keys[1]];
      }
      return memo;
    }, {});
  }

  environment.command('add [environment]')
    .description($('Add an environment'))
    .option('--environment <environment>', $('the environment name'))
    .option('--publish-settings-file-url <publishSettingsFileUrl>', $('the publish settings file URL'))
    .option('--management-portal-url <managementPortalUrl>', $('the management portal URL'))
    .option('--service-endpoint <serviceEndpoint>', $('the management service endpoint'))
    .option('--storage-endpoint <storageEndpoint>', $('the storage service endpoint'))
    .option('--sql-database-endpoint <sqlDatabaseEndpoint>', $('the SQL database endpoint'))
    .execute(function (environment, options, _) {
      environment = cli.interaction.promptIfNotGiven('New Environment name: ', environment, _);

      var existingEnvironment = profile.current.getEnvironment(environment);

      if (existingEnvironment) {
        throw new Error(util.format($('Duplicate environment %s'), existingEnvironment));
      } else {
        validateRequiredOptions({
          publishSettingsFileUrl: 'Publish settings file URL needs to be defined',
          managementPortalUrl: 'Portal URL needs to be defined',
          serviceEndpoint: 'Service endpoint needs to be defined',
          storageEndpoint: 'Storage endpoint needs to be defined',
          sqlDatabaseEndpoint: 'SQL database endpoint needs to be defined',
        }, options);

        var newEnvironment = new profile.Environment(safeOptions(options));
        newEnvironment.name = environment;
        profile.current.addEnvironment(newEnvironment);
        profile.current.save();
      }
    });

  environment.command('set [environment]')
    .description($('Update an environment'))
    .option('--environment <environment>', $('the environment name'))
    .option('--publish-settings-file-url <publishSettingsFileUrl>', $('the publish settings file URL'))
    .option('--management-portal-url <managementPortalUrl>', $('the management portal URL'))
    .option('--service-endpoint <serviceEndpoint>', $('the management service endpoint'))
    .option('--storage-endpoint <storageEndpoint>', $('the storage service endpoint'))
    .option('--sql-database-endp oint <sqlDatabaseEndpoint>', $('the SQL database endpoint'))
    .execute(function (environment, options, _) {
      environment = cli.interaction.promptIfNotGiven('New Environment name: ', environment, _);

      if (!options.publishSettingsFileUrl && !options.managementPortalUrl &&
        !options.serviceEndpoint && !options.storageEndpoint && !options.sqlDatabaseEndpoint) {
        throw new Error($('No URL to update was specified'));
      }

      var existingEnvironment = profile.current.getEnvironment(environment);

      if (!existingEnvironment) {
        throw new Error(util.format($('Unknown environment %s'), environment));
      } else {
        __.extend(existingEnvironment, safeOptions(options));
        profile.current.save();
      }
    });

  environment.command('delete [environment]')
    .description($('Delete an environment'))
    .option('--environment <environment>', $('the environment name'))
    .execute(function (environment, options, _) {
      environment = cli.interaction.promptIfNotGiven('New Environment name: ', environment, _);

      var existingEnvironment = profile.current.getEnvironment(environment);

      if (!existingEnvironment) {
        throw new Error(util.format($('Unknown environment %s'), environment));
      } else {
        profile.current.deleteEnvironment(existingEnvironment);
        profile.current.save();
      }
    });
};