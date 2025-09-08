"use strict";

const uuidv4 = require("uuid/v4");
const { of, forkJoin, from, iif, throwError } = require("rxjs");
const {
  mergeMap,
  catchError,
  map,
  toArray,
  tap,
  last,
  delay,
  take,
} = require("rxjs/operators");

const Event = require("@nebulae/event-store").Event;
const { CqrsResponseHelper } = require("@nebulae/backend-node-tools").cqrs;
const { ConsoleLogger } = require("@nebulae/backend-node-tools").log;
const { CustomError, INTERNAL_SERVER_ERROR_CODE, PERMISSION_DENIED } =
  require("@nebulae/backend-node-tools").error;
const { brokerFactory } = require("@nebulae/backend-node-tools").broker;

const broker = brokerFactory();
const eventSourcing = require("../../tools/event-sourcing").eventSourcing;
const { FeedParser } = require("../../tools/feed-parser");

const SharkAttackDA = require("./data-access/SharkAttackDA");

const READ_ROLES = ["SHARK_ATTACK_READ"];
const WRITE_ROLES = ["SHARK_ATTACK_WRITE"];
const REQUIRED_ATTRIBUTES = [];
const MATERIALIZED_VIEW_TOPIC = "emi-gateway-materialized-view-updates";

const SHARK_ATTACKS_FEED_URL =
  process.env.GAME_FEED_URL ||
  "https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/global-shark-attack/records?limit=100";

/**
 * Singleton instance
 * @type { SharkAttackCRUD }
 */
let instance;

class SharkAttackCRUD {
  constructor() {
  }

  /**     
   * Generates and returns an object that defines the CQRS request handlers.
   * 
   * The map is a relationship of: AGGREGATE_TYPE VS { MESSAGE_TYPE VS  { fn: rxjsFunction, instance: invoker_instance } }
   * 
   * ## Example
   *  { "CreateUser" : { "somegateway.someprotocol.mutation.CreateUser" : {fn: createUser$, instance: classInstance } } }
   */
  generateRequestProcessorMap() {
    return {
      'SharkAttack': {
        "emigateway.graphql.query.FactsMngSharkAttackListing": {
          fn: instance.getFactsMngSharkAttackListing$,
          instance,
          jwtValidation: { roles: READ_ROLES, attributes: REQUIRED_ATTRIBUTES },
        },
        "emigateway.graphql.query.FactsMngSharkAttack": {
          fn: instance.getSharkAttack$,
          instance,
          jwtValidation: { roles: READ_ROLES, attributes: REQUIRED_ATTRIBUTES },
        },
        "emigateway.graphql.query.FactsMngSharkAttacksByCountry": {
          fn: instance.getFactsMngSharkAttacksByCountry$,
          instance,
          jwtValidation: { roles: READ_ROLES, attributes: REQUIRED_ATTRIBUTES },
        },
        "emigateway.graphql.query.FactsMngSharkAttacksAggStats": {
          fn: instance.getFactsMngSharkAttacksAggStats$,
          instance,
          jwtValidation: { roles: READ_ROLES, attributes: REQUIRED_ATTRIBUTES },
        },
        "emigateway.graphql.mutation.FactsMngImportSharkAttacks": {
          fn: instance.importSharkAttacks$,
          instance,
          jwtValidation: {
            roles: WRITE_ROLES,
            attributes: REQUIRED_ATTRIBUTES,
          },
        },
        "emigateway.graphql.mutation.FactsMngCreateSharkAttack": {
          fn: instance.createSharkAttack$,
          instance,
          jwtValidation: {
            roles: WRITE_ROLES,
            attributes: REQUIRED_ATTRIBUTES,
          },
        },
        "emigateway.graphql.mutation.FactsMngUpdateSharkAttack": {
          fn: instance.updateSharkAttack$,
          instance,
          jwtValidation: {
            roles: WRITE_ROLES,
            attributes: REQUIRED_ATTRIBUTES,
          },
        },
        "emigateway.graphql.mutation.FactsMngDeleteSharkAttacks": {
          fn: instance.deleteSharkAttacks$,
          instance,
          jwtValidation: {
            roles: WRITE_ROLES,
            attributes: REQUIRED_ATTRIBUTES,
          },
        },
      }
    }
  };


  /**  
   * Gets the SharkAttack list
   *
   * @param {*} args args
   */
  getFactsMngSharkAttackListing$({ args }, authToken) {
    console.log('DEBUG - Listing args:', JSON.stringify(args, null, 2));
    console.log('DEBUG - Listing authToken:', JSON.stringify(authToken, null, 2));
    const { filterInput, paginationInput, sortInput } = args;
    const { queryTotalResultCount = false } = paginationInput || {};

    return forkJoin(
      SharkAttackDA.getSharkAttackList$(filterInput, paginationInput, sortInput).pipe(toArray()),
      queryTotalResultCount ? SharkAttackDA.getSharkAttackSize$(filterInput) : of(undefined),
    ).pipe(
      map(([listing, queryTotalResultCount]) => ({ listing, queryTotalResultCount })),
      mergeMap(rawResponse => CqrsResponseHelper.buildSuccessResponse$(rawResponse)),
      catchError(err => iif(() => err.name === 'MongoTimeoutError', throwError(err), CqrsResponseHelper.handleError$(err)))
    );
  }

  /**  
   * Gets the get SharkAttack by id
   *
   * @param {*} args args
   */
  getSharkAttack$({ args }, authToken) {
    const { id, organizationId } = args;
    return SharkAttackDA.getSharkAttack$(id, organizationId).pipe(
      mergeMap(rawResponse => CqrsResponseHelper.buildSuccessResponse$(rawResponse)),
      catchError(err => iif(() => err.name === 'MongoTimeoutError', throwError(err), CqrsResponseHelper.handleError$(err)))
    );

  }

  /**
   * Obtiene los agregados agrupados por pais y año
   */
  getFactsMngSharkAttacksAggStats$({ args }) {
    const { recordLimit } = args;

    return SharkAttackDA.getFactsMngSharkAttacksAggStats$(recordLimit).pipe(
      mergeMap((rawResponse) =>
        CqrsResponseHelper.buildSuccessResponse$(rawResponse)
      ),
      catchError((err) =>
        iif(
          () => err.name === "MongoTimeoutError",
          throwError(err),
          CqrsResponseHelper.handleError$(err)
        )
      )
    );
  }

  /**
   * Get shark attacks by country from external API
   *
   * @param {*} args args
   */
  getFactsMngSharkAttacksByCountry$({ args }, authToken) {
    const { country, organizationId } = args;
    console.log('DEBUG - getFactsMngSharkAttacksByCountry$ args:', { country, organizationId });
    
    return FeedParser.getSharkAttackDetailByCountry$(country).pipe(
      map((record) => {
        console.log('DEBUG - Processing record:', record);
        return {
          id: record.original_order || record.case_number || 'unknown',
          name: record.name || 'Unknown',
          country: record.country || country,
          age: record.age || 'Unknown',
          type: record.type || 'Unknown'
        };
      }),
      toArray(),
      tap((results) => console.log('DEBUG - Final results:', results)),
      mergeMap((rawResponse) =>
        CqrsResponseHelper.buildSuccessResponse$(rawResponse)
      ),
      catchError((err) => {
        console.error('ERROR in getFactsMngSharkAttacksByCountry$:', err);
        return CqrsResponseHelper.handleError$(err);
      })
    );
  }


  /**
  * Create a SharkAttack
  */
  createSharkAttack$({ root, args, jwt }, authToken) {
    const aggregateId = uuidv4();
    const input = {
      active: false,
      ...args.input,
    };

    return SharkAttackDA.createSharkAttack$(aggregateId, input, authToken.preferred_username).pipe(
      mergeMap(aggregate => forkJoin(
        CqrsResponseHelper.buildSuccessResponse$(aggregate),
        eventSourcing.emitEvent$(instance.buildAggregateMofifiedEvent('CREATE', 'SharkAttack', aggregateId, authToken, aggregate), { autoAcknowledgeKey: process.env.MICROBACKEND_KEY }),
        broker.send$(MATERIALIZED_VIEW_TOPIC, `FactsMngSharkAttackModified`, aggregate)
      )),
      map(([sucessResponse]) => sucessResponse),
      catchError(err => iif(() => err.name === 'MongoTimeoutError', throwError(err), CqrsResponseHelper.handleError$(err)))
    )
  }

  /**
   * updates an SharkAttack 
   */
  updateSharkAttack$({ root, args, jwt }, authToken) {
    const { id, input, merge } = args;

    return (merge ? SharkAttackDA.updateSharkAttack$ : SharkAttackDA.replaceSharkAttack$)(id, input, authToken.preferred_username).pipe(
      mergeMap(aggregate => forkJoin(
        CqrsResponseHelper.buildSuccessResponse$(aggregate),
        eventSourcing.emitEvent$(instance.buildAggregateMofifiedEvent(merge ? 'UPDATE_MERGE' : 'UPDATE_REPLACE', 'SharkAttack', id, authToken, aggregate), { autoAcknowledgeKey: process.env.MICROBACKEND_KEY }),
        broker.send$(MATERIALIZED_VIEW_TOPIC, `FactsMngSharkAttackModified`, aggregate)
      )),
      map(([sucessResponse]) => sucessResponse),
      catchError(err => iif(() => err.name === 'MongoTimeoutError', throwError(err), CqrsResponseHelper.handleError$(err)))
    )
  }


  /**
   * deletes an SharkAttack
   */
  deleteSharkAttacks$({ root, args, jwt }, authToken) {
    const { ids } = args;
    return forkJoin(
      SharkAttackDA.deleteSharkAttacks$(ids),
      from(ids).pipe(
        mergeMap(id => eventSourcing.emitEvent$(instance.buildAggregateMofifiedEvent('DELETE', 'SharkAttack', id, authToken, {}), { autoAcknowledgeKey: process.env.MICROBACKEND_KEY })),
        toArray()
      )
    ).pipe(
      map(([ok, esResps]) => ({ code: ok ? 200 : 400, message: `SharkAttack with id:s ${JSON.stringify(ids)} ${ok ? "has been deleted" : "not found for deletion"}` })),
      mergeMap((r) => forkJoin(
        CqrsResponseHelper.buildSuccessResponse$(r),
        broker.send$(MATERIALIZED_VIEW_TOPIC, `FactsMngSharkAttackModified`, { id: 'deleted', name: '', active: false, description: '' })
      )),
      map(([cqrsResponse, brokerRes]) => cqrsResponse),
      catchError(err => iif(() => err.name === 'MongoTimeoutError', throwError(err), CqrsResponseHelper.handleError$(err)))
    );
  }


  /**
   * Import shark attacks list
   */
  importSharkAttacks$({ root, args, jwt }, authToken) {
    return FeedParser.parseFeed$(SHARK_ATTACKS_FEED_URL).pipe(
      map((data) => ({
        ...data,
        id: data.original_order,
        active: true,
        organizationId: authToken.organizationId,
      })),
      //take(2),
      mergeMap((sharkAttack) =>
        forkJoin([
          eventSourcing.emitEvent$(
            instance.buildAggregateMofifiedEvent(
              "CREATE",
              "SharkAttack",
              sharkAttack.id,
              authToken,
              sharkAttack,
              "SharkAttackReported"
            )
            //{ autoAcknowledgeKey: process.env.MICROBACKEND_KEY } // para que no escuhe mis propios mensajes
          ),
          broker.send$(
            MATERIALIZED_VIEW_TOPIC,
            `FactsMngSharkAttackModified`,
            sharkAttack
          ),
        ])
      ),
      toArray(), //Espera todas las respuestas y luego lo convierte en un array
      // Respuesta al frontend
      map((result) => ({
        code: result.length,
        message: `::: ${result.length} Eventos emitidos`,
      })),
      mergeMap((aggregate) =>
        forkJoin(
          CqrsResponseHelper.buildSuccessResponse$(aggregate),
          instance.getFactsMngSharkAttackListing$(args)
        )
      ),
      map(([sucessResponse]) => sucessResponse),
      catchError((err) =>
        iif(
          () => err.name === "MongoTimeoutError",
          throwError(err),
          CqrsResponseHelper.handleError$(err)
        )
      )
    );
  }

  /**
   * Generate an Modified event
   * @param {string} modType 'CREATE' | 'UPDATE' | 'DELETE'
   * @param {*} aggregateType
   * @param {*} aggregateId
   * @param {*} authToken
   * @param {*} data
   * @returns {Event}
   */
  buildAggregateMofifiedEvent(
    modType,
    aggregateType,
    aggregateId,
    authToken,
    data,
    eventType
  ) {
    return new Event({
      eventType: eventType || `${aggregateType}Modified`,
      eventTypeVersion: 1,
      aggregateType: aggregateType,
      aggregateId,
      data: {
        modType,
        ...data,
      },
      user: authToken.preferred_username,
    });
  }
}

/**
 * @returns {SharkAttackCRUD}
 */
module.exports = () => {
  if (!instance) {
    instance = new SharkAttackCRUD();
    ConsoleLogger.i(`${instance.constructor.name} Singleton created`);
  }
  return instance;
};
