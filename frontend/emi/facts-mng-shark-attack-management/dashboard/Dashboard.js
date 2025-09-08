import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Grid, CircularProgress } from '@material-ui/core';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useQuery } from '@apollo/react-hooks';
import { FactsMngSharkAttacksAggStats } from '../gql/SharkAttack';

const Dashboard = () => {
    const { data, loading, error } = useQuery(FactsMngSharkAttacksAggStats({ recordLimit: 5 }).query, {
        variables: { recordLimit: 5 }
    });

    if (loading) return <CircularProgress />;
    if (error) return <Typography color="error">Error: {error.message}</Typography>;

    const stats = data?.FactsMngSharkAttacksAggStats || { countries: [], years: [], totalSharkAttacks: 0 };

    return (
        <div style={{ padding: 24 }}>
            <Typography variant="h4" gutterBottom>
                Dashboard de Ataques de Tiburones
            </Typography>
            
            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">Total de Ataques</Typography>
                            <Typography variant="h3" color="primary">
                                {stats.totalSharkAttacks}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Top 5 Países con Más Ataques
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={stats.countries}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="country" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="total" fill="#8884d8" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Tendencia por Años
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={stats.years}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="year" />
                                    <YAxis />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="total" stroke="#82ca9d" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </div>
    );
};

export default Dashboard;