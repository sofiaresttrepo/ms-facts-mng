import { gql } from 'apollo-boost';

export const FactsMngSharkAttackListing = (variables) => ({
    query: gql`
            query FactsMngSharkAttackListing($filterInput:FactsMngSharkAttackFilterInput ,$paginationInput:FactsMngSharkAttackPaginationInput,$sortInput:FactsMngSharkAttackSortInput){
                FactsMngSharkAttackListing(filterInput:$filterInput,paginationInput:$paginationInput,sortInput:$sortInput){
                    listing{
                       id, date, country, type, species, active
                    },
                    queryTotalResultCount
                }
            }`,
    variables,
    fetchPolicy: 'network-only',
})

export const FactsMngSharkAttack = (variables) => ({
    query: gql`
            query FactsMngSharkAttack($id: ID!, $organizationId: String!){
                FactsMngSharkAttack(id:$id, organizationId:$organizationId){
                    id, organizationId, active,
                    date, year, type, country, area, location, time, activity,
                    name, sex, age, injury, fatal_y_n,
                    species, investigator_or_source, pdf, href_formula, href, case_number, case_number0,
                    metadata{ createdBy, createdAt, updatedBy, updatedAt }
                }
            }`,
    variables,
    fetchPolicy: 'network-only',
})


export const FactsMngCreateSharkAttack = (variables) => ({
    mutation: gql`
            mutation  FactsMngCreateSharkAttack($input: FactsMngSharkAttackInput!){
                FactsMngCreateSharkAttack(input: $input){
                    id, organizationId, active,
                    date, year, type, country, area, location, time, activity,
                    name, sex, age, injury, fatal_y_n,
                    species, investigator_or_source, pdf, href_formula, href, case_number, case_number0,
                    metadata{ createdBy, createdAt, updatedBy, updatedAt }
                }
            }`,
    variables
})

export const FactsMngDeleteSharkAttack = (variables) => ({
    mutation: gql`
            mutation FactsMngSharkAttackListing($ids: [ID]!){
                FactsMngDeleteSharkAttacks(ids: $ids){
                    code,message
                }
            }`,
    variables
})

export const FactsMngUpdateSharkAttack = (variables) => ({
    mutation: gql`
            mutation  FactsMngUpdateSharkAttack($id: ID!,$input: FactsMngSharkAttackInput!, $merge: Boolean!){
                FactsMngUpdateSharkAttack(id:$id, input: $input, merge:$merge ){
                    id, organizationId, active,
                    date, year, type, country, area, location, time, activity,
                    name, sex, age, injury, fatal_y_n,
                    species, investigator_or_source, pdf, href_formula, href, case_number, case_number0
                }
            }`,
    variables
})

export const onFactsMngSharkAttackModified = (variables) => ([
    gql`subscription onFactsMngSharkAttackModified($id:ID!){
            FactsMngSharkAttackModified(id:$id){    
                id, organizationId, active,
                date, year, type, country, area, location, time, activity,
                name, sex, age, injury, fatal_y_n,
                species, investigator_or_source, pdf, href_formula, href, case_number, case_number0,
                metadata{ createdBy, createdAt, updatedBy, updatedAt }
            }
    }`,
    { variables }
])