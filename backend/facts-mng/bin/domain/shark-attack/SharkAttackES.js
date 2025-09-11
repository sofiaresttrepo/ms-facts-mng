"use strict";
const fs = require("fs");
const { iif, forkJoin, defer, throwError, of } = require("rxjs");
const { tap, catchError } = require("rxjs/operators");
const { ConsoleLogger } = require("@nebulae/backend-node-tools").log;

const SharkAttackDA = require("./data-access/SharkAttackDA");
// Imports the Google Cloud client library
const { PubSub } = require("@google-cloud/pubsub");
let credentials;

try {
  const credentialsJson = fs.readFileSync(
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    "utf8"
  );
  credentials = JSON.parse(credentialsJson);
} catch (err) {
  console.error(" Error al cargar credenciales de Google:", err.message);
  process.exit(1);
}

// Creates a client; cache this for further use
const pubSubClient = new PubSub({ 
  credentials,
  projectId: 'hardy-thinker-425419-r3'
});
/**
 * Singleton instance
 * @type { SharkAttackES }
 */
let instance;

class SharkAttackES {

    constructor() {
    }

    /**     
     * Generates and returns an object that defines the Event-Sourcing events handlers.
     * 
     * The map is a relationship of: AGGREGATE_TYPE VS { EVENT_TYPE VS  { fn: rxjsFunction, instance: invoker_instance } }
     * 
     * ## Example
     *  { "User" : { "UserAdded" : {fn: handleUserAdded$, instance: classInstance } } }
     */
    generateEventProcessorMap() {
        return {
            SharkAttack: {
                SharkAttackModified: {
                    fn: instance.handleSharkAttackModified$,
                    instance,
                    processOnlyOnSync: true,
                },
                SharkAttackReported: {
                    fn: instance.handleSharkAttackModified$,
                    instance,
                    processOnlyOnSync: false,
                },
            },
        }
    };

    publishMessage$(topicNameOrId, data) {
        return defer(() => {
            const payload = typeof data === "string" ? data : JSON.stringify(data);
            const dataBuffer = Buffer.from(payload);
            const topic = pubSubClient.topic(topicNameOrId);

            // La promesa se transforma en Observable con defer
            return topic.publishMessage({ data: dataBuffer });
        }).pipe(
            tap((messageId) => console.log(`Message ${messageId} published.`)),
            catchError((error) => {
                console.error(`Received error while publishing: ${error.message}`);
                return throwError(() => error); // Propagamos el error al stream
            })
        );
    }

    /**
     * Using the SharkAttackModified events restores the MaterializedView
     * This is just a recovery strategy
     * @param {*} SharkAttackModifiedEvent SharkAttack Modified Event
     */
    handleSharkAttackModified$({ etv, aid, av, data, user, timestamp }) {
        // mappers por versión
        const aggregateDataMapper = {
            0: () => {
                throw new Error("etv 0 is not an option");
            },
            1: (eventData) => {
                // Creamos un nuevo objeto sin modType
                const { modType, ...rest } = eventData;
                return rest;
            },
        };

        // Validamos si existe el etv (event type version)
        if (!aggregateDataMapper.hasOwnProperty(etv)) {
            return throwError(() => new Error(`Unsupported etv: ${etv}`));
        }

        const aggregateData = aggregateDataMapper[etv](data);

        let obs$;
        obs$ =
            data.modType === "DELETE"
                ? SharkAttackDA.deleteSharkAttack$(aid)
                : SharkAttackDA.updateSharkAttackFromRecovery$(aid, aggregateData, av);

        if (data.modType === "CREATE") {
            obs$ = SharkAttackDA.createIfNotExists$(aid, aggregateData);
        }

        return forkJoin([
            obs$,
            this.publishMessage$("neb-university-sophi", aggregateData),
        ]).pipe(
            tap((res) =>
                ConsoleLogger.i(
                    `SharkAttackES.handleSharkAttackModified: ${data.modType}: aid=${aid}, timestamp=${timestamp}`
                )
            ),
            catchError((err) => {
                console.log(
                    "⚠ Error al guardar en mongodb o publicar en gcloud: ",
                    err
                );
                return of(["No data", "No data"]);
            })
        );
    }
}


/**
 * @returns {SharkAttackES}
 */
module.exports = () => {
    if (!instance) {
        instance = new SharkAttackES();
        ConsoleLogger.i(`${instance.constructor.name} Singleton created`);
    }
    return instance;
};