
import React from 'react';
import { TextField, FormControlLabel, Switch, Grid, Typography, Divider, Select, MenuItem, FormControl, InputLabel } from '@material-ui/core';
import * as Yup from "yup";

export function basicInfoFormValidationsGenerator(T) {
    return {
        date: Yup.string().matches(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
        year: Yup.number().integer('Debe ser un número entero').min(1500, 'Año mínimo 1500').max(new Date().getFullYear(), 'Año no puede ser futuro'),
        type: Yup.string().oneOf(['Provoked', 'Unprovoked', 'Boat', 'Sea Disaster', 'Questionable'], 'Tipo de ataque inválido'),
        country: Yup.string().max(100, 'Máximo 100 caracteres'),
        area: Yup.string().max(200, 'Máximo 200 caracteres'),
        location: Yup.string().max(200, 'Máximo 200 caracteres'),
        activity: Yup.string().max(150, 'Máximo 150 caracteres'),
        name: Yup.string().max(100, 'Máximo 100 caracteres'),
        sex: Yup.string().oneOf(['M', 'F', 'Unknown'], 'Sexo inválido'),
        age: Yup.string().max(10, 'Máximo 10 caracteres'),
        injury: Yup.string().max(500, 'Máximo 500 caracteres'),
        fatal_y_n: Yup.string().oneOf(['Y', 'N', 'Unknown'], 'Valor inválido'),
        time: Yup.string().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)'),
        species: Yup.string().max(100, 'Máximo 100 caracteres'),
        investigator_or_source: Yup.string().max(200, 'Máximo 200 caracteres'),
        pdf: Yup.string().max(100, 'Máximo 100 caracteres'),
        href_formula: Yup.string().max(200, 'Máximo 200 caracteres'),
        href: Yup.string().url('Debe ser una URL válida'),
        case_number: Yup.string().max(50, 'Máximo 50 caracteres'),
        case_number0: Yup.string().max(50, 'Máximo 50 caracteres')
    };
}

/**
 * Complete SharkAttack form with all fields
 * @param {{dataSource,T}} props 
 */
export function BasicInfo(props) {
    const { dataSource: form, T, onChange, errors, touched, canWrite } = props;
    return (
        <div>
            {/* Basic Info Section */}
            <Typography variant="h6" className="mb-16">{T.translate("shark_attack.basic_info")}</Typography>
            <FormControlLabel
                control={
                    <Switch
                        checked={form.active || false}
                        onChange={onChange("active")}
                        id="active"
                        name="active"
                        disabled={!canWrite()}
                    />
                }
                label={T.translate("shark_attack.active")}
            />
            
            <Divider className="my-24" />
            
            {/* Incident Information */}
            <Typography variant="h6" className="mb-16">{T.translate("shark_attack.incident_info")}</Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <TextField
                        className="mt-8 mb-16"
                        label={T.translate("shark_attack.date")}
                        id="date"
                        name="date"
                        type="date"
                        value={form.date || ''}
                        onChange={onChange("date")}
                        variant="outlined"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        InputProps={{ readOnly: !canWrite() }}
                        helperText={(errors.date && touched.date) && errors.date}
                        error={errors.date && touched.date}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        className="mt-8 mb-16"
                        label={T.translate("shark_attack.year")}
                        id="year"
                        name="year"
                        type="number"
                        value={form.year || ''}
                        onChange={onChange("year")}
                        variant="outlined"
                        fullWidth
                        InputProps={{ readOnly: !canWrite(), inputProps: { min: 1500, max: new Date().getFullYear() } }}
                        helperText={(errors.year && touched.year) && errors.year}
                        error={errors.year && touched.year}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <FormControl variant="outlined" fullWidth className="mt-8 mb-16">
                        <InputLabel>{T.translate("shark_attack.type")}</InputLabel>
                        <Select
                            id="type"
                            name="type"
                            value={form.type || ''}
                            onChange={onChange("type")}
                            label={T.translate("shark_attack.type")}
                            disabled={!canWrite()}
                            error={errors.type && touched.type}
                        >
                            <MenuItem value="">Seleccionar...</MenuItem>
                            <MenuItem value="Provoked">Provocado</MenuItem>
                            <MenuItem value="Unprovoked">No Provocado</MenuItem>
                            <MenuItem value="Boat">Bote</MenuItem>
                            <MenuItem value="Sea Disaster">Desastre Marítimo</MenuItem>
                            <MenuItem value="Questionable">Cuestionable</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        className="mt-8 mb-16"
                        label={T.translate("shark_attack.country")}
                        id="country"
                        name="country"
                        value={form.country || ''}
                        onChange={onChange("country")}
                        variant="outlined"
                        fullWidth
                        inputProps={{ maxLength: 100 }}
                        InputProps={{ readOnly: !canWrite() }}
                        helperText={(errors.country && touched.country) ? errors.country : `${(form.country || '').length}/100`}
                        error={errors.country && touched.country}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        className="mt-8 mb-16"
                        label={T.translate("shark_attack.area")}
                        id="area"
                        name="area"
                        value={form.area || ''}
                        onChange={onChange("area")}
                        variant="outlined"
                        fullWidth
                        inputProps={{ maxLength: 200 }}
                        InputProps={{ readOnly: !canWrite() }}
                        helperText={(errors.area && touched.area) ? errors.area : `${(form.area || '').length}/200`}
                        error={errors.area && touched.area}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        className="mt-8 mb-16"
                        label={T.translate("shark_attack.location")}
                        id="location"
                        name="location"
                        value={form.location || ''}
                        onChange={onChange("location")}
                        variant="outlined"
                        fullWidth
                        inputProps={{ maxLength: 200 }}
                        InputProps={{ readOnly: !canWrite() }}
                        helperText={(errors.location && touched.location) ? errors.location : `${(form.location || '').length}/200`}
                        error={errors.location && touched.location}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        className="mt-8 mb-16"
                        label={T.translate("shark_attack.time")}
                        id="time"
                        name="time"
                        type="time"
                        value={form.time || ''}
                        onChange={onChange("time")}
                        variant="outlined"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        InputProps={{ readOnly: !canWrite() }}
                        helperText={(errors.time && touched.time) && errors.time}
                        error={errors.time && touched.time}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        className="mt-8 mb-16"
                        label={T.translate("shark_attack.activity")}
                        id="activity"
                        name="activity"
                        value={form.activity || ''}
                        onChange={onChange("activity")}
                        variant="outlined"
                        fullWidth
                        inputProps={{ maxLength: 150 }}
                        InputProps={{ readOnly: !canWrite() }}
                        helperText={(errors.activity && touched.activity) ? errors.activity : `${(form.activity || '').length}/150`}
                        error={errors.activity && touched.activity}
                    />
                </Grid>
            </Grid>
            
            <Divider className="my-24" />
            
            {/* Victim Information */}
            <Typography variant="h6" className="mb-16">{T.translate("shark_attack.victim_info")}</Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <TextField
                        className="mt-8 mb-16"
                        label={T.translate("shark_attack.name")}
                        id="name"
                        name="name"
                        value={form.name || ''}
                        onChange={onChange("name")}
                        variant="outlined"
                        fullWidth
                        inputProps={{ maxLength: 100 }}
                        InputProps={{ readOnly: !canWrite() }}
                        helperText={(errors.name && touched.name) ? errors.name : `${(form.name || '').length}/100`}
                        error={errors.name && touched.name}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <FormControl variant="outlined" fullWidth className="mt-8 mb-16">
                        <InputLabel>{T.translate("shark_attack.sex")}</InputLabel>
                        <Select
                            id="sex"
                            name="sex"
                            value={form.sex || ''}
                            onChange={onChange("sex")}
                            label={T.translate("shark_attack.sex")}
                            disabled={!canWrite()}
                            error={errors.sex && touched.sex}
                        >
                            <MenuItem value="">Seleccionar...</MenuItem>
                            <MenuItem value="M">Masculino</MenuItem>
                            <MenuItem value="F">Femenino</MenuItem>
                            <MenuItem value="Unknown">Desconocido</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        className="mt-8 mb-16"
                        label={T.translate("shark_attack.age")}
                        id="age"
                        name="age"
                        value={form.age || ''}
                        onChange={onChange("age")}
                        variant="outlined"
                        fullWidth
                        inputProps={{ maxLength: 10 }}
                        InputProps={{ readOnly: !canWrite() }}
                        helperText="Ej: 25, 30-35, Unknown"
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <FormControl variant="outlined" fullWidth className="mt-8 mb-16">
                        <InputLabel>{T.translate("shark_attack.fatal_y_n")}</InputLabel>
                        <Select
                            id="fatal_y_n"
                            name="fatal_y_n"
                            value={form.fatal_y_n || ''}
                            onChange={onChange("fatal_y_n")}
                            label={T.translate("shark_attack.fatal_y_n")}
                            disabled={!canWrite()}
                            error={errors.fatal_y_n && touched.fatal_y_n}
                        >
                            <MenuItem value="">Seleccionar...</MenuItem>
                            <MenuItem value="Y">Sí</MenuItem>
                            <MenuItem value="N">No</MenuItem>
                            <MenuItem value="Unknown">Desconocido</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        className="mt-8 mb-16"
                        label={T.translate("shark_attack.injury")}
                        id="injury"
                        name="injury"
                        value={form.injury || ''}
                        onChange={onChange("injury")}
                        variant="outlined"
                        fullWidth
                        multiline
                        rows={3}
                        inputProps={{ maxLength: 500 }}
                        InputProps={{ readOnly: !canWrite() }}
                        helperText={(errors.injury && touched.injury) ? errors.injury : `${(form.injury || '').length}/500`}
                        error={errors.injury && touched.injury}
                    />
                </Grid>
            </Grid>
            
            <Divider className="my-24" />
            
            {/* Investigation Information */}
            <Typography variant="h6" className="mb-16">{T.translate("shark_attack.investigation_info")}</Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <TextField
                        className="mt-8 mb-16"
                        label={T.translate("shark_attack.species")}
                        id="species"
                        name="species"
                        value={form.species || ''}
                        onChange={onChange("species")}
                        variant="outlined"
                        fullWidth
                        inputProps={{ maxLength: 100 }}
                        InputProps={{ readOnly: !canWrite() }}
                        helperText={(errors.species && touched.species) ? errors.species : `${(form.species || '').length}/100`}
                        error={errors.species && touched.species}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        className="mt-8 mb-16"
                        label={T.translate("shark_attack.investigator_or_source")}
                        id="investigator_or_source"
                        name="investigator_or_source"
                        value={form.investigator_or_source || ''}
                        onChange={onChange("investigator_or_source")}
                        variant="outlined"
                        fullWidth
                        inputProps={{ maxLength: 200 }}
                        InputProps={{ readOnly: !canWrite() }}
                        helperText={(errors.investigator_or_source && touched.investigator_or_source) ? errors.investigator_or_source : `${(form.investigator_or_source || '').length}/200`}
                        error={errors.investigator_or_source && touched.investigator_or_source}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        className="mt-8 mb-16"
                        label={T.translate("shark_attack.case_number")}
                        id="case_number"
                        name="case_number"
                        value={form.case_number || ''}
                        onChange={onChange("case_number")}
                        variant="outlined"
                        fullWidth
                        inputProps={{ maxLength: 50 }}
                        InputProps={{ readOnly: !canWrite() }}
                        helperText={(errors.case_number && touched.case_number) ? errors.case_number : `${(form.case_number || '').length}/50`}
                        error={errors.case_number && touched.case_number}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        className="mt-8 mb-16"
                        label={T.translate("shark_attack.case_number0")}
                        id="case_number0"
                        name="case_number0"
                        value={form.case_number0 || ''}
                        onChange={onChange("case_number0")}
                        variant="outlined"
                        fullWidth
                        inputProps={{ maxLength: 50 }}
                        InputProps={{ readOnly: !canWrite() }}
                        helperText={(errors.case_number0 && touched.case_number0) ? errors.case_number0 : `${(form.case_number0 || '').length}/50`}
                        error={errors.case_number0 && touched.case_number0}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        className="mt-8 mb-16"
                        label={T.translate("shark_attack.pdf")}
                        id="pdf"
                        name="pdf"
                        value={form.pdf || ''}
                        onChange={onChange("pdf")}
                        variant="outlined"
                        fullWidth
                        inputProps={{ maxLength: 100 }}
                        InputProps={{ readOnly: !canWrite() }}
                        helperText={(errors.pdf && touched.pdf) ? errors.pdf : `${(form.pdf || '').length}/100`}
                        error={errors.pdf && touched.pdf}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        className="mt-8 mb-16"
                        label={T.translate("shark_attack.href")}
                        id="href"
                        name="href"
                        type="url"
                        value={form.href || ''}
                        onChange={onChange("href")}
                        variant="outlined"
                        fullWidth
                        InputProps={{ readOnly: !canWrite() }}
                        helperText="Ingrese una URL válida"
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        className="mt-8 mb-16"
                        label={T.translate("shark_attack.href_formula")}
                        id="href_formula"
                        name="href_formula"
                        value={form.href_formula || ''}
                        onChange={onChange("href_formula")}
                        variant="outlined"
                        fullWidth
                        InputProps={{ readOnly: !canWrite() }}
                    />
                </Grid>
            </Grid>
        </div>
    );
}

