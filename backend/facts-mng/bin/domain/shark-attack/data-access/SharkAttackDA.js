"use strict";

let mongoDB = undefined;
const { map, mapTo, catchError } = require("rxjs/operators");
const { of, Observable, defer, forkJoin } = require("rxjs");

const { CustomError } = require("@nebulae/backend-node-tools").error;

const CollectionName = 'SharkAttack';

class SharkAttackDA {
  static start$(mongoDbInstance) {
    return Observable.create(observer => {
      if (mongoDbInstance) {
        mongoDB = mongoDbInstance;
        observer.next(`${this.name} using given mongo instance`);
      } else {
        mongoDB = require("../../../tools/mongo-db/MongoDB").singleton();
        observer.next(`${this.name} using singleton system-wide mongo instance`);
      }
      observer.next(`${this.name} started`);
      observer.complete();
    });
  }

  /**
   * Gets a SharkAttack by its id
   */
  static getSharkAttack$(id, organizationId) {
    const collection = mongoDB.db.collection(CollectionName);

    const query = {
      _id: id
    };
    if (organizationId) {
      query.organizationId = organizationId;
    }
    return defer(() => collection.findOne(query)).pipe(
      map((res) => {
        return res !== null
          ? { ...res, id: res._id || res.id }
          : {}
      })
    );
  }

  static generateListingQuery(filter) {
    const query = {};
    if (filter.name) {
      query["name"] = { $regex: filter.name, $options: "i" };
    }
    if (filter.organizationId) {
      query["organizationId"] = filter.organizationId;
    }
    if (filter.country) {
      query["country"] = { $regex: filter.country, $options: "i" };
    }
    if (filter.year) {
      query["year"] = filter.year;
    }
    if (filter.type) {
      query["type"] = { $regex: filter.type, $options: "i" };
    }
    if (filter.active !== undefined) {
      query["active"] = filter.active;
    }
    return query;
  }

  static getSharkAttackList$(filter = {}, pagination = {}, sortInput) {
    const collection = mongoDB.db.collection(CollectionName);
    const { page = 0, count = 10 } = pagination;

    const query = this.generateListingQuery(filter);    
    const projection = { 
      date: 1, 
      country: 1, 
      type: 1, 
      species: 1, 
      active: 1 
    };

    let cursor = collection
      .find(query, { projection })
      .skip(count * page)
      .limit(count);

    const sort = {};
    if (sortInput) {
      sort[sortInput.field] = sortInput.asc ? 1 : -1;
    } else {
      sort["metadata.createdAt"] = -1;
    }
    cursor = cursor.sort(sort);


    return mongoDB.extractAllFromMongoCursor$(cursor).pipe(
      map(res => ({ ...res, id: res._id || res.id }))
    );
  }

  static getSharkAttackSize$(filter = {}) {
    const collection = mongoDB.db.collection(CollectionName);
    const query = this.generateListingQuery(filter);    
    return defer(() => collection.countDocuments(query));
  }

  /**
  * creates a new SharkAttack 
  * @param {*} id SharkAttack ID
  * @param {*} SharkAttack properties
  */
  static createSharkAttack$(_id, properties, createdBy) {

    const metadata = { createdBy, createdAt: Date.now(), updatedBy: createdBy, updatedAt: Date.now() };
    const collection = mongoDB.db.collection(CollectionName);
    return defer(() => collection.insertOne({
      _id,
      ...properties,
      metadata,
    })).pipe(
      map(() => ({ id: _id, ...properties, metadata }))
    );
  }

  /**
  * creates or updates a SharkAttack (upsert)
  * @param {*} id SharkAttack ID
  * @param {*} SharkAttack properties
  */
  static upsertSharkAttack$(_id, properties, user) {
    const collection = mongoDB.db.collection(CollectionName);
    const now = Date.now();
    return defer(() => 
      collection.findOneAndUpdate(
        { _id },
        {
          $set: {
            ...properties,
            "metadata.updatedBy": user,
            "metadata.updatedAt": now
          },
          $setOnInsert: {
            "metadata.createdBy": user,
            "metadata.createdAt": now
          }
        },
        {
          upsert: true,
          returnOriginal: false
        }
      )
    ).pipe(
      map(result => result && result.value ? { ...result.value, id: result.value._id } : { id: _id, ...properties })
    );
  }

  /**
  * creates a SharkAttack if it doesn't exist (used by event sourcing)
  * @param {*} _id SharkAttack ID
  * @param {*} properties SharkAttack properties
  */
  static createIfNotExists$(_id, properties) {
    const collection = mongoDB.db.collection(CollectionName);
    const now = Date.now();
    return defer(() => 
      collection.findOneAndUpdate(
        { _id },
        {
          $setOnInsert: {
            _id,
            ...properties,
            metadata: {
              createdBy: 'system',
              createdAt: now,
              updatedBy: 'system',
              updatedAt: now
            }
          }
        },
        {
          upsert: true,
          returnOriginal: false
        }
      )
    ).pipe(
      map(result => result && result.value ? { ...result.value, id: result.value._id } : { id: _id, ...properties })
    );
  }

  /**
   *  Crea o actualiza un registro existente
   */
  static createIfNotExists$(_id, properties, av) {
    const collection = mongoDB.db.collection(CollectionName);
    return defer(() =>
      collection.updateOne(
        {
          _id,
        },
        { $setOnInsert: { ...properties } },
        {
          returnOriginal: false,
          upsert: true,
        }
      )
    ).pipe(
      map((result) =>
        result && result.value
          ? { ...result.value, id: result.value._id }
          : undefined
      )
    );
  }

  /**
  * modifies the SharkAttack properties
  * @param {String} id  SharkAttack ID
  * @param {*} SharkAttack properties to update
  */
  static updateSharkAttack$(_id, properties, updatedBy) {
    const collection = mongoDB.db.collection(CollectionName);
    return defer(() =>
      collection.findOneAndUpdate(
        { _id },
        {
          $set: {
            ...properties,
            "metadata.updatedBy": updatedBy, "metadata.updatedAt": Date.now()
          }
        },
        {
          returnOriginal: false,
        }
      )
    ).pipe(
      map(result => result && result.value ? { ...result.value, id: result.value._id } : undefined)
    );
  }

  /**
  * modifies the SharkAttack properties
  * @param {String} id  SharkAttack ID
  * @param {*} SharkAttack properties to update
  */
  static updateSharkAttackFromRecovery$(_id, properties, av) {
    const collection = mongoDB.db.collection(CollectionName);
    return defer(() =>
      collection.updateOne(
        {
          _id,
        },
        { $set: { ...properties } },
        {
          returnOriginal: false,
          upsert: true
        }
      )
    ).pipe(
      map(result => result && result.value ? { ...result.value, id: result.value._id } : undefined)
    );
  }

  /**
  * modifies the SharkAttack properties
  * @param {String} id  SharkAttack ID
  * @param {*} SharkAttack properties to update
  */
  static replaceSharkAttack$(_id, properties) {
    const collection = mongoDB.db.collection(CollectionName);
    return defer(() =>
      collection.replaceOne(
        { _id },
        properties,
      )
    ).pipe(
      mapTo({ id: _id, ...properties })
    );
  }

  /**
    * deletes an SharkAttack 
    * @param {*} _id  SharkAttack ID
  */
  static deleteSharkAttack$(_id) {
    const collection = mongoDB.db.collection(CollectionName);
    return defer(() =>
      collection.deleteOne({ _id })
    );
  }

  /**
    * deletes multiple SharkAttack at once
    * @param {*} _ids  SharkAttack IDs array
  */
  static deleteSharkAttacks$(_ids) {
    const collection = mongoDB.db.collection(CollectionName);
    return defer(() =>
      collection.deleteMany({ _id: { $in: _ids } })
    ).pipe(
      map(({ deletedCount }) => deletedCount > 0)
    );
  }

  /**
   * Obtiene los agregados agrupados por pais y año
   */
  static getFactsMngSharkAttacksAggStats$(recordLimit) {
    const collection = mongoDB.db.collection(CollectionName);

    const pipelineCountry = [
      { $group: { _id: "$country", total: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: recordLimit },
      { $project: { _id: 0, country: "$_id", total: 1 } },
    ];

    const pipelineYear = [
      { $group: { _id: { $toInt: "$year" }, total: { $sum: 1 } } },
      { $sort: { _id: -1 } },
      { $project: { _id: 0, year: "$_id", total: 1 } },
    ];

    const groupByCountry$ = defer(() =>
      collection.aggregate(pipelineCountry).toArray()
    );
    const groupByYear$ = defer(() =>
      collection.aggregate(pipelineYear).toArray()
    );
    const totalDocuments$ = defer(() => collection.countDocuments());

    return forkJoin([groupByCountry$, groupByYear$, totalDocuments$]).pipe(
      map(([countries, years, totalSharkAttacks]) => ({
        countries,
        years,
        totalSharkAttacks,
      })),
      catchError((err) =>
        of({
          countries: [],
          years: [],
          totalSharkAttacks: 0,
        })
      )
    );
  }

  /**
   * Obtiene los agregados agrupados por país y año
   */
  static getFactsMngSharkAttacksAggStats$(recordLimit) {
    const collection = mongoDB.db.collection(CollectionName);

    const pipelineCountry = [
      { $group: { _id: "$country", total: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: recordLimit },
      { $project: { _id: 0, country: "$_id", total: 1 } },
    ];

    const pipelineYear = [
      { $group: { _id: { $toInt: "$year" }, total: { $sum: 1 } } },
      { $sort: { _id: -1 } },
      { $project: { _id: 0, year: "$_id", total: 1 } },
    ];

    const groupByCountry$ = defer(() =>
      collection.aggregate(pipelineCountry).toArray()
    );
    const groupByYear$ = defer(() =>
      collection.aggregate(pipelineYear).toArray()
    );
    const totalDocuments$ = defer(() => collection.countDocuments());

    return forkJoin([groupByCountry$, groupByYear$, totalDocuments$]).pipe(
      map(([countries, years, totalSharkAttacks]) => ({
        countries,
        years,
        totalSharkAttacks,
      })),
      catchError((err) =>
        of({
          countries: [],
          years: [],
          totalSharkAttacks: 0,
        })
      )
    );
  }

}
/**
 * @returns {SharkAttackDA}
 */
module.exports = SharkAttackDA;
