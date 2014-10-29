/*
 * Copyright (c) 2011 Danish Maritime Authority.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package dk.dma.embryo.tiles.service;

import dk.dma.embryo.common.persistence.Dao;
import dk.dma.embryo.tiles.model.TileSet;

import java.util.List;

/**
 * Created by Jesper Tejlgaard on 8/26/14.
 */
public interface TileSetDao extends Dao {

    public List<TileSet> listByStatus(TileSet.Status status);

    public List<TileSet> listByProviderAndType(String provider, String type);

    public List<TileSet> listByTypeAndStatus(String provider, TileSet.Status status);

    public List<TileSet> listByProviderAndTypeAndStatus(String provider, String type, TileSet.Status status);

    public TileSet getByNameAndProvider(String name, String provider);

}
