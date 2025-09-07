"use strict";

const uuidv4 = require("uuid/v4");
const { of, forkJoin, from, iif, throwError } = require("rxjs");
const { mergeMap, catchError, map, toArray, pluck } = require('rxjs/operators');

const Event = require("@nebulae/event-store").Event;
const { CqrsResponseHelper } = require('@nebulae/backend-node-tools').cqrs;
const { ConsoleLogger } = require('@nebulae/backend-node-tools').log;
const { CustomError, INTERNAL_SERVER_ERROR_CODE, PERMISSION_DENIED } = require("@nebulae/backend-node-tools").error;
const { brokerFactory } = require("@nebulae/backend-node-tools").broker;

const broker = brokerFactory();
const eventSourcing = require("../../tools/event-sourcing").eventSourcing;
const SharkAttackDA = require("./data-access/SharkAttackDA");

const READ_ROLES = ["SHARK_ATTACK_READ"];
const WRITE_ROLES = ["SHARK_ATTACK_WRITE"];
const REQUIRED_ATTRIBUTES = [];
const MATERIALIZED_VIEW_TOPIC = "emi-gateway-materialized-view-updates";

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
        "emigateway.graphql.query.FactsMngSharkAttackListing": { fn: instance.getFactsMngSharkAttackListing$, instance, jwtValidation: { roles: READ_ROLES, attributes: REQUIRED_ATTRIBUTES } },
        "emigateway.graphql.query.FactsMngSharkAttack": { fn: instance.getSharkAttack$, instance, jwtValidation: { roles: READ_ROLES, attributes: REQUIRED_ATTRIBUTES } },
        "emigateway.graphql.query.moreSharkAttacksByCountry": { fn: instance.getMoreSharkAttacksByCountry$, instance, jwtValidation: { roles: READ_ROLES, attributes: REQUIRED_ATTRIBUTES } },
        "emigateway.graphql.mutation.FactsMngCreateSharkAttack": { fn: instance.createSharkAttack$, instance, jwtValidation: { roles: WRITE_ROLES, attributes: REQUIRED_ATTRIBUTES } },
        "emigateway.graphql.mutation.FactsMngUpdateSharkAttack": { fn: instance.updateSharkAttack$, instance, jwtValidation: { roles: WRITE_ROLES, attributes: REQUIRED_ATTRIBUTES } },
        "emigateway.graphql.mutation.FactsMngDeleteSharkAttacks": { fn: instance.deleteSharkAttacks$, instance, jwtValidation: { roles: WRITE_ROLES, attributes: REQUIRED_ATTRIBUTES } },
        "emigateway.graphql.mutation.importSharkAttacks": { fn: instance.importSharkAttacks$, instance, jwtValidation: { roles: WRITE_ROLES, attributes: REQUIRED_ATTRIBUTES } },
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
   * Gets more shark attack cases by country from OpenDataSoft API
   *
   * @param {*} args args
   */
  getMoreSharkAttacksByCountry$({ args }, authToken) {
    const { country } = args;
    const https = require('https');
    const apiUrl = `https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/global-shark-attack/records?where=country%3D%27${encodeURIComponent(country)}%27&limit=5`;
    
    return from(new Promise((resolve, reject) => {
      const req = https.get(apiUrl, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            const cases = (response.results || []).map(record => ({
              country: record.country || '',
              date: record.date || '',
              activity: record.activity || '',
              location: record.location || ''
            }));
            resolve(cases);
          } catch (error) {
            reject(error);
          }
        });
      });
      req.on('error', reject);
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    })).pipe(
      mergeMap(rawResponse => CqrsResponseHelper.buildSuccessResponse$(rawResponse)),
      catchError(err => CqrsResponseHelper.handleError$(err))
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
   * Import 100 shark attacks from OpenDataSoft API
   */
  importSharkAttacks$({ args }, authToken) {
    console.log('DEBUG - authToken:', JSON.stringify(authToken, null, 2));
    const https = require('https');
    const apiUrl = 'https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/global-shark-attack/records?limit=100';
    
    return from(new Promise((resolve, reject) => {
      const req = https.get(apiUrl, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            resolve(response.results || []);
          } catch (error) {
            reject(error);
          }
        });
      });
      req.on('error', reject);
      req.setTimeout(30000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    })).pipe(
      mergeMap(records => {
        const importPromises = records.map(record => {
          const aggregateId = record.original_order || uuidv4();
          const sharkAttackData = {
            organizationId: authToken.selectedOrganization || authToken.organizationId || 'default',
            date: record.date || '',
            year: record.year ? parseInt(record.year) : null,
            type: record.type || '',
            country: record.country || '',
            area: record.area || '',
            location: record.location || '',
            activity: record.activity || '',
            name: record.name || '',
            sex: record.sex || '',
            age: record.age || '',
            injury: record.injury || '',
            fatal_y_n: record.fatal_y_n || '',
            time: record.time || '',
            species: record.species || '',
            investigator_or_source: record.investigator_or_source || '',
            pdf: record.pdf || '',
            href_formula: record.href_formula || '',
            href: record.href || '',
            case_number: record.case_number || '',
            case_number0: record.case_number0 || '',
            active: true
          };
          
          return SharkAttackDA.upsertSharkAttack$(aggregateId, sharkAttackData, authToken.preferred_username).pipe(
            mergeMap(aggregate => forkJoin(
              of(aggregate),
              eventSourcing.emitEvent$(instance.buildSharkAttackReportedEvent(aggregateId, authToken, aggregate), { autoAcknowledgeKey: process.env.MICROBACKEND_KEY })
            )),
            map(([aggregate]) => aggregate),
            catchError(err => {
              console.error(`Error importing record ${aggregateId}:`, err);
              return of(null);
            })
          );
        });
        
        return forkJoin(importPromises).pipe(
          map(results => results.filter(r => r !== null)),
          map(importedRecords => ({
            code: 200,
            message: `Successfully imported ${importedRecords.length} out of ${records.length} shark attack records`
          }))
        );
      }),
      mergeMap(rawResponse => CqrsResponseHelper.buildSuccessResponse$(rawResponse)),
      catchError(err => CqrsResponseHelper.handleError$(err))
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
  buildAggregateMofifiedEvent(modType, aggregateType, aggregateId, authToken, data) {
    return new Event({
      eventType: `${aggregateType}Modified`,
      eventTypeVersion: 1,
      aggregateType: aggregateType,
      aggregateId,
      data: {
        modType,
        ...data
      },
      user: authToken.preferred_username
    })
  }

  /**
   * Generate a SharkAttackReported event for imported records
   */
  buildSharkAttackReportedEvent(aggregateId, authToken, data) {
    return new Event({
      eventType: "SharkAttackReported",
      eventTypeVersion: 1,
      aggregateType: "SharkAttack",
      aggregateId,
      data,
      user: authToken.preferred_username
    })
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
