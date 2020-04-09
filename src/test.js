const knex = require('knex')({client: 'mysql'});

const IgniteClient = require('apache-ignite-client');

const IgniteClientConfiguration = IgniteClient.IgniteClientConfiguration;

const SqlFieldsQuery = IgniteClient.SqlFieldsQuery;

const CacheConfiguration = IgniteClient.CacheConfiguration;
    
async function connectClient() {
    const igniteClient = new IgniteClient();
    try {
        const igniteClientConfiguration = new IgniteClientConfiguration('utility.jumpi.org:10800', 'worker1.jumpi.org:10800', 'worker2.jumpi.org:10800', 'worker3.jumpi.org:10800')
        await igniteClient.connect(igniteClientConfiguration);

        // const teste = knex("instances").insert({
        //  name : "test2",
        //  created_at : new Date(),
        //  updated_at : new Date(),
        //  id : "2344" 
        // }).toString();

        const teste = knex("instances").count('* as count').toString();

        console.log(teste)

        const createQuery = new SqlFieldsQuery(teste)

        const cache = await igniteClient.getOrCreateCache("SQL_PUBLIC_INSTANCES", new CacheConfiguration().
          setSqlSchema('PUBLIC'));

        const result = (await cache.query(createQuery)).getAll()

        console.log(await result)
    }
    catch (err) {
        console.log(err.message);
    }
}
  
connectClient();




