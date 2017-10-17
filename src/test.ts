import { Server } from './index';
import { MongoDbConnector } from './database-connections/mongodb-connector';

const mongoConnectionString = `mongodb://192.168.184.128:27017/proxy`;

const server = new Server(80);
server.addDBConnector(new MongoDbConnector(mongoConnectionString));


server.run()
.then(connectors => {
    console.log(connectors);
})
.catch(err => {
    console.log(err);
});

