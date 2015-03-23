var services_loader = require ('../../lib/services');
var moment = require('moment');
var auth = require('../auth');

module.exports.add_routes = function (app, storage){

  app.get('/login', function(req, res) {
    res.render('login.html', {
      title: 'Login'
    });
  });

  app.all('*', function(req, res, next){
    res.locals.moment = moment;
    next();
  });

  //-------------------------------
  // Url log detail
  //-------------------------------
  app.get('/details', auth.ensureAuthenticated, function(req, res){

    services_loader.load_services(function(err, services){
      if (err) {
        console.error(err);
        return res.end(err);
      }

      var service = services.filter(function(service){
        return (service.host.name === req.query ['host'] && service.name === req.query ['service']);
      })[0];

      if (!service){
        return res.end('not found');
      }

      storage.report_one(service, function (err, service){
        res.render('details.html', {
          title: service.url_info,
          service : service,
          eventsSince : moment (+new Date() - service.remove_events_older_than_seconds * 1000),
          status: service.data ? service.data.status : 'unavailable', // no data collected yet
          critical_events: service.data ? service.data.events.filter(function(item){return item.type == 'critical';}) : [],
          warning_events: service.data ? service.data.events.filter(function(item){return item.type == 'warning';}) : []
        });
      });
    });
  });

  //-------------------------------
  // List of hosts and url's
  //-------------------------------
  app.get('/', auth.ensureAuthenticated, function(req, res){
    res.render('list.html', {
      title: 'watchmen'
    });
  });

  //-------------------------------
  // Get list (JSON)
  //-------------------------------
  app.get('/getdata', auth.ensureAuthenticated, function(req, res){
    services_loader.load_services(function(err, services){
      if (err) {
        console.error(err);
        return res.end(err);
      }
      storage.report_all(services, function (err, data){
        if (err) {
          console.error(err);
          return res.end(err);
        }
        res.json(data);
      });
    });
  });

};
