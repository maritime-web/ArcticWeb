/* Copyright (c) 2011 Danish Maritime Authority
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this library.  If not, see <http://www.gnu.org/licenses/>.
 */
package dk.dma.arcticweb.dao;

import static org.junit.Assert.assertEquals;

import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.Persistence;

import org.junit.After;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;

import dk.dma.embryo.domain.Role;
import dk.dma.embryo.domain.SailorRole;
import dk.dma.embryo.domain.SecuredUser;
import dk.dma.embryo.domain.ShoreRole;
import dk.dma.embryo.domain.VesselOwnerRole;

public class RealmDaoImplTest {

    private static EntityManagerFactory factory;
    private EntityManager entityManager;
    private RealmDao repository;

    @BeforeClass
    public static void setupForAll() {
        factory = Persistence.createEntityManagerFactory("componentTest");
        
        EntityManager entityManager = factory.createEntityManager();
        entityManager.getTransaction().begin();
        
//        Permission perm1 = new Permission("ais");
//        Permission perm2 = new Permission("ais:country");
//        Permission perm3 = new Permission("ais:country:DK");
//        Permission perm4 = new Permission("ais:region:europe");

//        entityManager.persist(perm1);
//        entityManager.persist(perm2);
//        entityManager.persist(perm3);
//        entityManager.persist(perm4);
        
        Role sailor = new SailorRole();
        Role shore = new ShoreRole();
        Role role3 = new VesselOwnerRole();

//        sailor.add(perm1);
//        sailor.add(perm2);
//        sailor.add(perm3);
//
//        shore.add(perm1);
//        shore.add(perm4);

        entityManager.persist(sailor);
        entityManager.persist(shore);
        entityManager.persist(role3);

        SecuredUser user1 = new SecuredUser("user1", "pw1", null);
        SecuredUser user2 = new SecuredUser("user2", "pw2", null);
        
        user1.setRole(sailor);
        entityManager.persist(user1);
        entityManager.persist(sailor);
        
        user2.setRole(shore);
        
        entityManager.persist(user2);
        
        entityManager.getTransaction().commit();
        entityManager.close();
    }

    @Before
    public void setup() {
        entityManager = factory.createEntityManager();
        repository = new RealmDaoImpl(entityManager);
        entityManager.clear();
    }

    @After
    public void tearDown() {
        entityManager.close();
    }

    @Test
    public void testFindByUsername() {
        SecuredUser user = repository.findByUsername("user1");
        
        entityManager.clear();

        assertEquals("user1", user.getUserName());
        assertEquals("pw1", user.getHashedPassword());
    }


    @Test
    public void testGetByPrimaryKey() {
        SecuredUser user1 = repository.getByPrimaryKeyReturnAll(1L);

        // clear persistence context to test that roles and permissions have been selected eagerly
        entityManager.clear();

        assertEquals("user1", user1.getUserName());
        assertEquals("pw1", user1.getHashedPassword());
        assertEquals("sailor", user1.getRole().getLogicalName());

        entityManager.clear();
        
        // asserting on user 2
        SecuredUser user2 = repository.getByPrimaryKeyReturnAll(2L);

        // clear persistence context to test that roles and permissions have been selected eagerly
        entityManager.clear();

        assertEquals("user2", user2.getUserName());
        assertEquals("pw2", user2.getHashedPassword());
        assertEquals("shore", user2.getRole().getLogicalName());
    }

}
