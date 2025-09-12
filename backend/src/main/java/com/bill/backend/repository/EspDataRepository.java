package com.bill.backend.repository;

import com.bill.backend.model.EspData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EspDataRepository extends JpaRepository<EspData, Long> {
    // get all records for a device
    List<EspData> findByEspMac(String espMac);

    // get latest record by timestamp
    EspData findTopByEspMacOrderByTimestampDesc(String espMac);
}
