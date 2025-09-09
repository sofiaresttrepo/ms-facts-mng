import React from 'react';
import { Card, CardContent, Typography, Grid, CircularProgress, LinearProgress, List, ListItem } from '@material-ui/core';
import { useQuery } from '@apollo/react-hooks';
import { FactsMngSharkAttacksAggStats } from '../gql/SharkAttack';

const Dashboard = () => {
    const { data, loading, error } = useQuery(FactsMngSharkAttacksAggStats({ recordLimit: 5 }).query, {
        variables: { recordLimit: 5 }
    });

    if (loading) return <div style={{ padding: 24 }}><CircularProgress /></div>;
    if (error) return <Typography color="error">Error: {error.message}</Typography>;

    const stats = (data && data.FactsMngSharkAttacksAggStats) || { countries: [], years: [], totalSharkAttacks: 0 };
    const maxCountryValue = Math.max(...(stats.countries || []).map(c => c.total), 1);
    const maxYearValue = Math.max(...(stats.years || []).map(y => y.total), 1);

    return (
        <div style={{ padding: 24 }}>
            <Typography variant="h4" gutterBottom>
                Dashboard de Ataques de Tiburones
            </Typography>
            
            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Card style={{ height: '100%' }}>
                        <CardContent style={{ textAlign: 'center' }}>
                            <Typography variant="h6" color="textSecondary">Total de Ataques</Typography>
                            <Typography variant="h2" color="primary" style={{ fontWeight: 'bold', margin: '16px 0' }}>
                                {stats.totalSharkAttacks}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Ataques registrados
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={8}>
                    <Card style={{ height: '100%' }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Top 5 Países con Más Ataques
                            </Typography>
                            <List>
                                {(stats.countries || []).map((country, index) => (
                                    <ListItem key={index} style={{ paddingLeft: 0 }}>
                                        <div style={{ width: '100%' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                <Typography variant="body2">{country.country}</Typography>
                                                <Typography variant="body2" color="primary">{country.total}</Typography>
                                            </div>
                                            <LinearProgress 
                                                variant="determinate" 
                                                value={(country.total / maxCountryValue) * 100}
                                                style={{ height: 8, borderRadius: 4 }}
                                            />
                                        </div>
                                    </ListItem>
                                ))}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Ataques por Año
                            </Typography>
                            <Grid container spacing={2}>
                                {(stats.years || []).slice(0, 10).map((year, index) => (
                                    <Grid item xs={6} sm={4} md={2} key={index}>
                                        <Card variant="outlined" style={{ textAlign: 'center', padding: 8 }}>
                                            <Typography variant="h6" color="primary">{year.year}</Typography>
                                            <Typography variant="h4" style={{ fontWeight: 'bold' }}>{year.total}</Typography>
                                            <LinearProgress 
                                                variant="determinate" 
                                                value={(year.total / maxYearValue) * 100}
                                                style={{ marginTop: 8, height: 4 }}
                                            />
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </div>
    );
};

export default Dashboard;